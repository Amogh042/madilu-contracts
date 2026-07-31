import Papa from "papaparse";
import { GOOGLE_SHEET_CSV_URL, type Student } from "./pg-data";

const COLUMN_MAP: Record<string, keyof Student> = {
  "Timestamp": "timestamp",
  "Full Name (as per Aadhaar)": "name",
  "Date of Birth": "dob",
  "Contact Number": "contactNumber",
  "Email Address": "email",
  "Permanent Address (Full residential address)": "permanentAddress",
  "Age": "age",
  "College Name": "collegeName",
  "College ID Number": "studentId",
  "Parent/Guardian Full Name": "guardianName",
  "Parent/Guardian Address (Full residential address)": "guardianAddress",
  "Parent/Guardian Contact Number": "guardianPhone",
  "Parent/Guardian Email Address": "guardianEmail",
  "Parent/Guardian Age": "guardianAge",
  "Relationship with Student (S/o, D/o, W/o)": "guardianRelation",
  "Select PG Option": "pgOption",
  "Preferred Payment Mode": "paymentMode",
  "Declaration of Accuracy and Agreement to Terms": "declaration",
  "Gender": "gender",
};

function mapColumnToField(header: string): keyof Student | null {
  if (COLUMN_MAP[header]) return COLUMN_MAP[header];
  const headerLower = header.toLowerCase().trim();
  for (const [col, field] of Object.entries(COLUMN_MAP)) {
    if (col.toLowerCase().trim() === headerLower) return field;
  }
  return null;
}

export async function fetchStudents(): Promise<Student[]> {
  if (!GOOGLE_SHEET_CSV_URL || GOOGLE_SHEET_CSV_URL.startsWith("PASTE_")) {
    throw new Error("Google Sheet CSV URL not configured. Set GOOGLE_SHEET_CSV_URL in src/lib/pg-data.ts");
  }
  const res = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!res.ok) throw new Error(`Failed to fetch sheet (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  const headers = parsed.meta.fields || [];
  const headerFieldMap = new Map<string, keyof Student>();
  for (const h of headers) {
    const field = mapColumnToField(h);
    if (field) headerFieldMap.set(h, field);
  }

  return parsed.data
    .map((row): Student => {
      const student: Student = {
        timestamp: "", name: "", dob: "", contactNumber: "", email: "",
        permanentAddress: "", age: "", collegeName: "", studentId: "",
        guardianName: "", guardianAddress: "", guardianPhone: "", guardianEmail: "",
        guardianAge: "", guardianRelation: "", pgOption: "", paymentMode: "",
        declaration: "", gender: "",
      };
      for (const [header, field] of headerFieldMap) {
        const val = row[header];
        if (val) student[field] = String(val).trim();
      }
      return student;
    })
    .filter((s) => s.name);
}
