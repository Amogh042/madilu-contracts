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

export async function checkManagerPhone(phone: string): Promise<"new" | "needs_password" | "has_password" | "not_found"> {
  const { data, error } = await supabase.rpc("check_manager_phone", { p_phone: phone });
  if (error) throw error;
  return data as "new" | "needs_password" | "has_password" | "not_found";
}

export async function setManagerPassword(phone: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("set_manager_password", { p_phone: phone, p_password: password });
  if (error) throw error;
  return data as boolean;
}

export async function verifyManagerPassword(phone: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_manager_password", { p_phone: phone, p_password: password });
  console.log("[verifyManagerPassword] raw result:", JSON.stringify(data), "type:", typeof data, "error:", error);
  if (error) throw error;
  return data === true;
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

export async function addManager(manager: { name: string; email: string; phone: string; pg_name: string }) {
  const { data, error } = await supabase
    .from("managers")
    .insert(manager)
    .select()
    .single();
  if (error) {
    console.error("Supabase addManager error:", error);
    throw new Error(error.message || "Failed to add manager");
  }
  return data as DbManager;
}

export async function toggleManagerActive(id: string, active: boolean) {
  const { error } = await supabase
    .from("managers")
    .update({ active })
    .eq("id", id);
  if (error) throw new Error(error.message || "Failed to update manager");
}

export async function deleteManager(id: string) {
  const { error } = await supabase.from("managers").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete manager");
}
