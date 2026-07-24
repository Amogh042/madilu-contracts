import { supabase } from "./supabase";
import type { DbManager } from "./managers-db";

const MANAGER_SESSION_KEY = "madilu_manager_session";

export type ManagerSession = {
  id: string;
  name: string;
  phone: string;
  pgNames: string[];
};

export function getManagerSession(): ManagerSession | null {
  try {
    const raw = sessionStorage.getItem(MANAGER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setManagerSession(manager: DbManager) {
  const pgNames = manager.pg_name.split(",").map(s => s.trim()).filter(Boolean);
  sessionStorage.setItem(
    MANAGER_SESSION_KEY,
    JSON.stringify({ id: manager.id, name: manager.name, phone: manager.phone, pgNames })
  );
}

export function clearManagerSession() {
  sessionStorage.removeItem(MANAGER_SESSION_KEY);
}

export async function ownerSignIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function ownerSignOut() {
  await supabase.auth.signOut();
}

export async function getOwnerSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
