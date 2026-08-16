import Papa from "papaparse";
import { GOOGLE_SHEET_CSV_URL, type Student } from "./pg-data";

function getField(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key]?.trim()) return row[key].trim();
    const found = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase());
    if (found && row[found]?.trim()) return row[found].trim();
  }
  for (const key of keys) {
    const kl = key.toLowerCase();
    const partial = Object.keys(row).find(
      (k) => k.toLowerCase().includes(kl) || kl.includes(k.toLowerCase()),
    );
    if (partial && row[partial]?.trim()) return row[partial].trim();
  }
  return "";
}

function parseStudentRow(row: Record<string, string>): Student {
  return {
    timestamp: getField(row, "Timestamp"),
    name: getField(row, "Full Name (as per Aadhaar)", "Full Name", "Name", "Student Name"),
    dob: getField(row, "Date of Birth", "DOB", "Birth Date"),
    contactNumber: getField(
      row,
      "Contact Number",
      "Phone Number",
      "Mobile Number",
      "Phone",
      "Mobile",
    ),
    email: getField(row, "Email Address", "Email", "Student Email"),
    permanentAddress: getField(
      row,
      "Permanent Address (Full residential address)",
      "Permanent Address",
      "Address",
    ),
    age: getField(row, "Age"),
    collegeName: getField(
      row,
      "College Name",
      "College",
      "Working At",
      "College Name / Working At",
    ),
    studentId: getField(
      row,
      "College ID Number",
      "Student ID",
      "Student ID / Roll Number",
      "College ID",
      "Roll Number",
      "ID",
    ),
    guardianName: getField(
      row,
      "Parent/Guardian Full Name",
      "Parent Name",
      "Guardian Name",
      "Parent/Guardian Name",
    ),
    guardianAddress: getField(
      row,
      "Parent/Guardian Address (Full residential address)",
      "Parent/Guardian Address",
      "Parent Address",
      "Guardian Address",
    ),
    guardianPhone: getField(
      row,
      "Parent/Guardian Contact Number",
      "Parent/Guardian Phone",
      "Parent Phone",
      "Guardian Phone",
      "Guardian Contact",
    ),
    guardianEmail: getField(
      row,
      "Parent/Guardian Email Address",
      "Parent/Guardian Email",
      "Parent Email",
      "Guardian Email",
    ),
    guardianAge: getField(row, "Parent/Guardian Age", "Guardian Age"),
    guardianRelation: getField(
      row,
      "Relationship with Student (S/o, D/o, W/o)",
      "Relationship with Student",
      "Relation",
    ),
    aadhaarNumber: getField(row, "Aadhaar Number", "Aadhar Number", "Aadhaar", "Aadhar"),
    pgOption: getField(row, "Select PG Option", "PG Option", "PG Name", "PG"),
    paymentMode: getField(row, "Preferred Payment Mode", "Payment Mode", "Payment"),
    declaration: getField(row, "Declaration of Accuracy and Agreement to Terms", "Declaration"),
    gender: getField(row, "Gender"),
  };
}

export async function fetchStudents(): Promise<Student[]> {
  if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.startsWith("PASTE_")) {
    throw new Error(
      "Google Sheet CSV URL not configured. Set GOOGLE_SHEET_CSV_URL in src/lib/pg-data.ts",
    );
  }
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`);
  const text = await res.text();
  console.log("[fetchStudents] Raw CSV (first 500):", text.substring(0, 500));

  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  console.log("[fetchStudents] CSV Headers:", parsed.meta.fields);
  console.log("[fetchStudents] CSV rows:", parsed.data.length);

  const students = parsed.data
    .map((row) => parseStudentRow(row))
    .filter((s) => s.name.trim() !== "");

  console.log("[fetchStudents] Students with names:", students.length);
  if (students.length > 0) console.log("[fetchStudents] First student:", students[0]);

  return students;
}
