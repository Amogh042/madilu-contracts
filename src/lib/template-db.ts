import { supabase } from "./supabase";

export async function fetchTemplate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("agreement_template")
    .select("*")
    .limit(1)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("fetchTemplate error:", error);
    throw error;
  }
  if (data?.paragraphs) {
    return typeof data.paragraphs === "string" ? data.paragraphs : JSON.stringify(data.paragraphs);
  }
  if (data?.template_text) {
    return data.template_text;
  }
  return null;
}

export async function saveTemplate(text: string, updatedBy: string) {
  const { error } = await supabase
    .from("agreement_template")
    .upsert({
      id: 1,
      paragraphs: text,
      updated_at: new Date().toISOString(),
    });
  if (error) {
    console.error("saveTemplate error:", error);
    throw error;
  }
}
