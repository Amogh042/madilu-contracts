import { supabase } from "./supabase";
import type { AgreementData, Instalment } from "./pg-data";

export type DbAgreement = {
  id: string;
  manager_id: string | null;
  student_name: string;
  student_phone: string;
  student_email: string;
  student_dob: string;
  student_address: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_address: string;
  pg_name: string;
  pg_address: string;
  room_number: string;
  monthly_rent: number;
  payment_mode: string;
  start_date: string;
  end_date: string;
  security_deposit: number;
  maintenance_charges: number;
  owner_name: string | null;
  owner_contact: string | null;
  owner_father_name: string | null;
  owner_age: string | null;
  owner_address: string | null;
  resident_age: string | null;
  resident_college: string | null;
  resident_student_id: string | null;
  parent_father_name: string | null;
  parent_age: string | null;
  agreement_text_snapshot: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  rejection_reason: string | null;
};

export function agreementDataToRow(d: AgreementData, managerId: string | null) {
  let rentValue = d.monthlyRent;
  let snapshot: string | null = null;
  if (d.paymentMode === "Instalments" && d.instalments?.length) {
    rentValue = d.instalments.reduce((sum, i) => sum + (i.amount || 0), 0);
    snapshot = JSON.stringify({ instalments: d.instalments });
  }

  return {
    manager_id: managerId,
    student_name: d.student.name,
    student_phone: d.student.phone,
    student_email: d.student.email,
    student_dob: d.student.dob,
    student_address: d.student.permanentAddress,
    guardian_name: d.student.parentName,
    guardian_phone: d.student.parentPhone,
    guardian_email: d.student.parentEmail,
    guardian_address: d.student.parentAddress,
    pg_name: d.pgName,
    pg_address: d.pgAddress,
    room_number: d.roomNumber,
    monthly_rent: rentValue,
    payment_mode: d.paymentMode,
    start_date: d.startDate,
    end_date: d.endDate,
    security_deposit: d.securityDeposit,
    maintenance_charges: d.maintenanceCharges,
    owner_name: d.ownerName,
    owner_contact: d.ownerContact,
    owner_father_name: d.ownerFatherName,
    owner_age: d.ownerAge,
    owner_address: d.ownerAddress,
    resident_age: d.residentAge,
    resident_college: d.residentCollege,
    resident_student_id: d.residentStudentId,
    parent_father_name: d.parentFatherName,
    parent_age: d.parentAge,
    agreement_text_snapshot: snapshot,
  };
}

export function rowToAgreementData(r: DbAgreement): AgreementData {
  let instalments: Instalment[] | undefined;
  if (r.agreement_text_snapshot) {
    try {
      const snap = JSON.parse(r.agreement_text_snapshot);
      if (Array.isArray(snap.instalments)) {
        instalments = snap.instalments;
      } else {
        const legacy: Instalment[] = [];
        if (snap.annualAmount1) legacy.push({ amount: snap.annualAmount1, dueDate: snap.annualDate1 || "" });
        if (snap.annualAmount2) legacy.push({ amount: snap.annualAmount2, dueDate: snap.annualDate2 || "" });
        if (legacy.length) instalments = legacy;
      }
    } catch {}
  }

  const paymentMode: AgreementData["paymentMode"] =
    r.payment_mode === "Monthly" ? "Monthly" : "Instalments";

  return {
    student: {
      name: r.student_name,
      dob: r.student_dob || "",
      phone: r.student_phone || "",
      email: r.student_email || "",
      pg: r.pg_name || "",
      permanentAddress: r.student_address || "",
      parentName: r.guardian_name || "",
      parentAddress: r.guardian_address || "",
      parentPhone: r.guardian_phone || "",
      parentEmail: r.guardian_email || "",
      paymentMode: r.payment_mode || "",
      declaration: "",
      timestamp: r.created_at,
    },
    ownerName: r.owner_name || "",
    ownerContact: r.owner_contact || "",
    ownerFatherName: r.owner_father_name || "",
    ownerAge: r.owner_age || "",
    ownerAddress: r.owner_address || "",
    residentAge: r.resident_age || "",
    residentCollege: r.resident_college || "",
    residentStudentId: r.resident_student_id || "",
    parentFatherName: r.parent_father_name || "",
    parentAge: r.parent_age || "",
    pgName: r.pg_name,
    pgAddress: r.pg_address || "",
    roomNumber: r.room_number || "",
    monthlyRent: r.monthly_rent || 0,
    paymentMode,
    instalments,
    startDate: r.start_date || "",
    endDate: r.end_date || "",
    securityDeposit: r.security_deposit || 0,
    maintenanceCharges: r.maintenance_charges || 0,
  };
}

export async function createAgreement(d: AgreementData, managerId: string | null, status: "pending" | "approved" = "pending") {
  const row = agreementDataToRow(d, managerId);
  const insertPayload = { ...row, status };
  console.log("[createAgreement] manager_id:", managerId, "status:", status);
  console.log("[createAgreement] payload:", JSON.stringify(insertPayload, null, 2));
  const { data, error } = await supabase
    .from("agreements")
    .insert(insertPayload)
    .select()
    .single();
  if (error) {
    console.error("[createAgreement] Supabase error:", error.message, error.details, error.hint, error.code);
    throw new Error(`Supabase insert failed: ${error.message}${error.details ? " — " + error.details : ""}${error.hint ? " (hint: " + error.hint + ")" : ""}`);
  }
  console.log("[createAgreement] success, id:", data?.id);
  return data as DbAgreement;
}

export async function updateAgreement(id: string, d: AgreementData) {
  const row = agreementDataToRow(d, null);
  const { manager_id: _, ...rest } = row;
  const { data, error } = await supabase
    .from("agreements")
    .update(rest)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as DbAgreement;
}

export async function fetchAgreements(filters?: { pg_name?: string; manager_id?: string; status?: string }) {
  let q = supabase.from("agreements").select("*").order("created_at", { ascending: false });
  if (filters?.pg_name) q = q.eq("pg_name", filters.pg_name);
  if (filters?.manager_id) q = q.eq("manager_id", filters.manager_id);
  if (filters?.status) q = q.eq("status", filters.status);
  const { data, error } = await q;
  if (error) {
    console.error("fetchAgreements error:", error);
    throw error;
  }
  return (data || []) as DbAgreement[];
}

export async function approveAgreement(id: string, approvedBy: string) {
  const { error } = await supabase
    .from("agreements")
    .update({ status: "approved", approved_by: approvedBy, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function rejectAgreement(id: string, reason: string) {
  const { error } = await supabase
    .from("agreements")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAgreement(id: string) {
  const { error } = await supabase.from("agreements").delete().eq("id", id);
  if (error) throw error;
}
