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
  if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL === "PASTE_YOUR_CSV_URL_HERE") {
    throw new Error("Google Sheet CSV URL not configured. Set GOOGLE_SHEET_CSV_URL in src/lib/pg-data.ts");
  }
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  return parsed.data
    .map((row): Student => ({
      name: pick(row, ["Name", "Student Name", "Full Name"]),
      phone: pick(row, ["Phone", "Mobile", "Contact", "Phone Number"]),
      email: pick(row, ["Email", "Email Address"]),
      pg: pick(row, ["PG", "PG Name", "Selected PG"]),
      permanentAddress: pick(row, ["Permanent Address", "Address"]),
      parentName: pick(row, ["Parent Name", "Guardian Name", "Parent/Guardian Name"]),
      parentAddress: pick(row, ["Parent Address", "Guardian Address"]),
      parentPhone: pick(row, ["Parent Phone", "Parent Contact", "Guardian Phone"]),
      parentEmail: pick(row, ["Parent Email", "Guardian Email"]),
      paymentMode: pick(row, ["Payment Mode", "Payment Option", "Payment"]),
    }))
    .filter((s) => s.name);
}
