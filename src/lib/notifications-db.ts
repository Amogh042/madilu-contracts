import { supabase } from "./supabase";

export type DbNotification = {
  id: string;
  user_type: "manager" | "owner";
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  agreement_id: string | null;
};

export async function fetchNotifications(userType: "manager" | "owner", userId?: string) {
  let q = supabase.from("notifications").select("*").eq("user_type", userType);
  if (userType === "manager" && userId) q = q.eq("user_id", userId);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []) as DbNotification[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userType: "manager" | "owner", userId?: string) {
  let q = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_type", userType)
    .eq("is_read", false);
  if (userType === "manager" && userId) q = q.eq("user_id", userId);
  const { error } = await q;
  if (error) throw error;
}

export async function getUnreadCount(
  userType: "manager" | "owner",
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_type", userType)
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
  return count || 0;
}

export async function createNotification(n: {
  user_type: "manager" | "owner";
  user_id: string;
  title: string;
  message: string;
  agreement_id?: string;
}) {
  const { error } = await supabase.from("notifications").insert(n);
  if (error) throw error;
}
