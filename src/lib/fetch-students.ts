import Papa from "papaparse";
import { GOOGLE_SHEET_CSV_URL, type Student } from "./pg-data";

const pick = (row: Record<string, string>, keys: string[]): string => {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const kl = k.toLowerCase().trim();
    const exact = rowKeys.find((rk) => rk.toLowerCase().trim() === kl);
    if (exact && row[exact]) return String(row[exact]).trim();
  }
  for (const k of keys) {
    const kl = k.toLowerCase().trim();
    const partial = rowKeys.find((rk) => rk.toLowerCase().trim().includes(kl) || kl.includes(rk.toLowerCase().trim()));
    if (partial && row[partial]) return String(row[partial]).trim();
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
      name: pick(row, ["Full Name", "Name", "Student Name"]),
      dob: pick(row, ["Date of Birth", "DOB", "Birth Date"]),
      phone: pick(row, ["Contact Number", "Phone Number", "Mobile Number", "Phone", "Mobile"]),
      email: pick(row, ["Email Address", "Email", "Student Email"]),
      permanentAddress: pick(row, ["Permanent Address (Full residential address)", "Permanent Address", "Address"]),
      parentName: pick(row, ["Parent/Guardian Full Name", "Parent Name", "Guardian Name", "Parent/Guardian Name"]),
      parentAddress: pick(row, ["Parent/Guardian Address (Full residential address)", "Parent/Guardian Address", "Parent Address", "Guardian Address"]),
      parentPhone: pick(row, ["Parent/Guardian Contact Number", "Parent/Guardian Phone", "Parent Phone", "Guardian Phone", "Guardian Contact"]),
      parentEmail: pick(row, ["Parent/Guardian Email Address", "Parent/Guardian Email", "Parent Email", "Guardian Email"]),
      pg: pick(row, ["Select PG Option", "PG Option", "PG Name", "PG"]),
      declaration: pick(row, ["Declaration of Accuracy and Agreement to Terms", "Declaration"]),
      paymentMode: pick(row, ["Payment Mode", "Payment"]),
    }))
    .filter((s) => s.name);
}
