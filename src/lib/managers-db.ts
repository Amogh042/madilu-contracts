import { supabase } from "./supabase";

export type DbManager = {
  id: string;
  name: string;
  email: string;
  phone: string;
  pg_name: string;
  active: boolean;
  auth_user_id: string | null;
  created_at: string;
};

export type ManagerLookup = {
  id: string;
  name: string;
  phone: string;
  pg_name: string;
  password_hash: string | null;
  active: boolean;
};

export async function lookupManagerByPhone(phone: string): Promise<{
  status: "not_found" | "inactive" | "needs_password" | "has_password";
  manager?: ManagerLookup;
}> {
  const { data, error } = await supabase
    .from("managers")
    .select("id, name, phone, pg_name, password_hash, active")
    .eq("phone", phone)
    .single();

  console.log("[lookupManagerByPhone] result:", JSON.stringify(data), "error:", error);

  if (error || !data) {
    return { status: "not_found" };
  }

  if (!data.active) {
    return { status: "inactive", manager: data as ManagerLookup };
  }

  if (!data.password_hash || data.password_hash === "") {
    console.log("[lookupManagerByPhone] No password set, needs_password");
    return { status: "needs_password", manager: data as ManagerLookup };
  }

  console.log("[lookupManagerByPhone] Has password");
  return { status: "has_password", manager: data as ManagerLookup };
}

export async function checkManagerPhone(
  phone: string,
): Promise<"new" | "needs_password" | "has_password" | "not_found"> {
  const { data, error } = await supabase.rpc("check_manager_phone", { p_phone: phone });
  console.log(
    "[checkManagerPhone] raw result:",
    JSON.stringify(data),
    "type:",
    typeof data,
    "error:",
    error,
  );
  if (error) throw error;
  const result = String(data);
  if (result === "not_found") return "not_found";
  if (result === "needs_password" || result === "new") return "needs_password";
  if (result === "has_password") return "has_password";
  console.warn("[checkManagerPhone] unexpected value, defaulting to needs_password:", data);
  return "needs_password";
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function setManagerPassword(phone: string, password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  console.log("[setManagerPassword] storing SHA-256 hash for phone:", phone);
  const { error } = await supabase
    .from("managers")
    .update({ password_hash: hash })
    .eq("phone", phone);
  if (error) {
    console.error("[setManagerPassword] error:", error);
    throw new Error(error.message || "Failed to set password");
  }
  return true;
}

export async function verifyManagerPassword(phone: string, password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  const { data, error } = await supabase
    .from("managers")
    .select("password_hash")
    .eq("phone", phone)
    .single();
  console.log(
    "[verifyManagerPassword] stored hash:",
    data?.password_hash?.slice(0, 8) + "...",
    "computed hash:",
    hash.slice(0, 8) + "...",
  );
  if (error || !data) return false;
  if (data.password_hash === hash) return true;
  // If stored hash isn't SHA-256 (length != 64), it's from the old broken RPC — force password reset
  if (data.password_hash && data.password_hash.length !== 64) {
    console.warn("[verifyManagerPassword] Legacy non-SHA-256 hash detected, clearing for reset");
    await supabase.from("managers").update({ password_hash: null }).eq("phone", phone);
    return false;
  }
  return false;
}

export async function getManagerByPhone(phone: string): Promise<DbManager | null> {
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .eq("phone", phone)
    .eq("active", true)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as DbManager;
}

export async function fetchManagers() {
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DbManager[];
}

export async function addManager(manager: {
  name: string;
  email: string;
  phone: string;
  pg_name: string;
}) {
  const { data, error } = await supabase.from("managers").insert(manager).select().single();
  if (error) {
    console.error("Supabase addManager error:", error);
    throw new Error(error.message || "Failed to add manager");
  }
  return data as DbManager;
}

export async function updateManager(
  id: string,
  fields: { name: string; phone: string; email: string; pg_name: string },
) {
  const { error } = await supabase.from("managers").update(fields).eq("id", id);
  if (error) {
    if (
      error.message?.includes("duplicate") ||
      error.message?.includes("unique") ||
      error.code === "23505"
    ) {
      throw new Error("This phone number is already assigned to another manager");
    }
    throw new Error(error.message || "Failed to update manager");
  }
}

export async function toggleManagerActive(id: string, active: boolean) {
  const { error } = await supabase.from("managers").update({ active }).eq("id", id);
  if (error) throw new Error(error.message || "Failed to update manager");
}

export async function deleteManager(id: string) {
  const { error } = await supabase.from("managers").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete manager");
}
