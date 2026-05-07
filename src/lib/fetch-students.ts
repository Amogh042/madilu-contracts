import Papa from "papaparse";
import { GOOGLE_SHEET_CSV_URL, type Student } from "./pg-data";

const pick = (row: Record<string, string>, keys: string[]): string => {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.toLowerCase().trim() === k.toLowerCase().trim());
    if (found && row[found]) return String(row[found]).trim();
  }
  return "";
};

export async function fetchStudents(): Promise<Student[]> {
  if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.startsWith("PASTE_")) {
    throw new Error("Google Sheet CSV URL not configured. Set GOOGLE_SHEET_CSV_URL in src/lib/pg-data.ts");
  }
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return parsed.data
    .map((row): Student => ({
      timestamp: pick(row, ["Timestamp"]),
      name: pick(row, ["Full Name"]),
      dob: pick(row, ["Date of Birth"]),
      phone: pick(row, ["Contact Number"]),
      email: pick(row, ["Email Address"]),
      permanentAddress: pick(row, ["Permanent Address (Full residential address)"]),
      parentName: pick(row, ["Parent/Guardian Full Name"]),
      parentAddress: pick(row, ["Parent/Guardian Address (Full residential address)"]),
      parentPhone: pick(row, ["Parent/Guardian Contact Number"]),
      parentEmail: pick(row, ["Parent/Guardian Email Address"]),
      pg: pick(row, ["Select PG Option"]),
      declaration: pick(row, ["Declaration of Accuracy and Agreement to Terms"]),
      paymentMode: "",
    }))
    .filter((s) => s.name);
}
