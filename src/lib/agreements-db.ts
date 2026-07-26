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
  agreement_text_snapshot: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
};

export function agreementDataToRow(d: AgreementData, managerId: string | null) {
  let rentValue = d.monthlyRent;
  const extra: Record<string, unknown> = {};
  if (d.paymentMode === "Instalments" && d.instalments?.length) {
    rentValue = d.instalments.reduce((sum, i) => sum + (i.amount || 0), 0);
    extra.instalments = d.instalments;
  }
  if (d.ownerFatherName) extra.ownerFatherName = d.ownerFatherName;
  if (d.ownerAge) extra.ownerAge = d.ownerAge;
  if (d.ownerAddress) extra.ownerAddress = d.ownerAddress;
  if (d.residentAge) extra.residentAge = d.residentAge;
  if (d.residentCollege) extra.residentCollege = d.residentCollege;
  if (d.residentStudentId) extra.residentStudentId = d.residentStudentId;
  if (d.parentFatherName) extra.parentFatherName = d.parentFatherName;
  if (d.parentAge) extra.parentAge = d.parentAge;

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
    agreement_text_snapshot: Object.keys(extra).length > 0 ? JSON.stringify(extra) : null,
  };
}

export function rowToAgreementData(r: DbAgreement): AgreementData {
  let instalments: Instalment[] | undefined;
  let snap: Record<string, unknown> = {};
  if (r.agreement_text_snapshot) {
    try { snap = JSON.parse(r.agreement_text_snapshot); } catch {}
  }

  if (Array.isArray(snap.instalments)) {
    instalments = snap.instalments as Instalment[];
  }

  const paymentMode: AgreementData["paymentMode"] =
    r.payment_mode === "Monthly" ? "Monthly" : "Instalments";

  if (!instalments && r.payment_mode !== "Monthly") {
    const legacy: Instalment[] = [];
    if (snap.annualAmount1) legacy.push({ amount: snap.annualAmount1 as number, dueDate: (snap.annualDate1 as string) || "" });
    if (snap.annualAmount2) legacy.push({ amount: snap.annualAmount2 as number, dueDate: (snap.annualDate2 as string) || "" });
    if (legacy.length) instalments = legacy;
  }

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
    ownerFatherName: (snap.ownerFatherName as string) || "",
    ownerAge: (snap.ownerAge as string) || "",
    ownerAddress: (snap.ownerAddress as string) || "",
    residentAge: (snap.residentAge as string) || "",
    residentCollege: (snap.residentCollege as string) || "",
    residentStudentId: (snap.residentStudentId as string) || "",
    parentFatherName: (snap.parentFatherName as string) || "",
    parentAge: (snap.parentAge as string) || "",
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
  const { data, error } = await supabase
    .from("agreements")
    .insert({ ...row, status })
    .select()
    .single();
  if (error) throw error;
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
    .update({ status: "approved", approved_by: approvedBy, approved_at: new Date().toISOString() })
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
