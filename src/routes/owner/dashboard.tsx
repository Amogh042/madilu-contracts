import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Background } from "@/components/agreement/Background";
import { StatCard } from "@/components/agreement/StatCard";
import { Stepper } from "@/components/agreement/Stepper";
import { StudentStep } from "@/components/agreement/StudentStep";
import { DetailsStep } from "@/components/agreement/DetailsStep";
import { PreviewStep } from "@/components/agreement/PreviewStep";
import { generateAgreementPDF } from "@/lib/generate-pdf";
import { AgreementStudentPicker } from "@/components/agreement/AgreementStudentPicker";
import { SecondaryDocPreview } from "@/components/agreement/SecondaryDocPreview";
import { getOwnerSession, ownerSignOut } from "@/lib/auth";
import {
  createAgreement, fetchAgreements, updateAgreement,
  approveAgreement, rejectAgreement, deleteAgreement,
  rowToAgreementData, type DbAgreement,
} from "@/lib/agreements-db";
import {
  fetchManagers, addManager, updateManager, toggleManagerActive, deleteManager,
  type DbManager,
} from "@/lib/managers-db";
import {
  fetchNotifications, markAllNotificationsRead, createNotification,
  type DbNotification,
} from "@/lib/notifications-db";
import { fetchTemplate, saveTemplate } from "@/lib/template-db";
import { buildAgreementSections, type AgreementSection } from "@/lib/agreement-text";
import { PG_LIST, PG_ADDRESSES, type AgreementData, type Student } from "@/lib/pg-data";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/owner/dashboard")({
  component: OwnerDashboard,
});

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));
const inputCls = "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all";
const triggerCls = "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-all hover:border-[#D4A853]/40 data-[state=open]:border-[#D4A853]/60 data-[placeholder]:text-white/40";
const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-300",
  approved: "bg-green-500/15 text-green-300",
  rejected: "bg-red-500/15 text-red-300",
};

const initialAgreement = (s: Student): AgreementData => {
  const pmRaw = (s.paymentMode || "").toLowerCase();
  const paymentMode: AgreementData["paymentMode"] =
    pmRaw.includes("annual") || pmRaw.includes("instalment") || pmRaw.includes("installment") ? "Instalments" : "Monthly";
  const pg = s.pgOption?.trim() || "";
  return {
    student: s,
    ownerName: "", ownerContact: "", ownerFatherName: "", ownerAge: "", ownerAddress: "",
    residentAge: s.age || "", residentCollege: s.collegeName || "", residentStudentId: s.studentId || "",
    residentAadhaar: s.aadhaarNumber || "",
    parentFatherName: s.guardianName || "", parentAge: s.guardianAge || "",
    pgName: pg, pgAddress: PG_ADDRESSES[pg] || "", roomNumber: "",
    monthlyRent: 0, paymentMode, startDate: "", endDate: "",
    securityDeposit: 0, maintenanceCharges: 0,
  };
};

type View = "home" | "agreements" | "pending" | "flow" | "managers" | "template" | "notifications" | "extension-pick" | "extension-preview" | "exit-pick" | "exit-preview";

function OwnerDashboard() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    getOwnerSession().then(s => {
      if (!s) navigate({ to: "/owner/login" });
      else { setAuthed(true); setUserId(s.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) navigate({ to: "/owner/login" });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const [view, setView] = useState<View>("home");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Student | null>(null);
  const [agreementData, setAgreementData] = useState<AgreementData | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [agreements, setAgreements] = useState<DbAgreement[]>([]);
  const [managers, setManagers] = useState<DbManager[]>([]);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [filterPg, setFilterPg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [agreementSearch, setAgreementSearch] = useState("");

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [newMgr, setNewMgr] = useState({ name: "", email: "", phone: "", pg_names: [] as string[] });
  const [mgrAdding, setMgrAdding] = useState(false);
  const [editMgr, setEditMgr] = useState<{ id: string; name: string; email: string; phone: string; pg_names: string[] } | null>(null);
  const [mgrSaving, setMgrSaving] = useState(false);

  const [templateText, setTemplateText] = useState("");
  const [templateStatus, setTemplateStatus] = useState<"" | "saved" | string>("");

  const [secondaryDoc, setSecondaryDoc] = useState<DbAgreement | null>(null);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [aResult, mResult, nResult] = await Promise.allSettled([
      fetchAgreements(),
      fetchManagers(),
      userId ? fetchNotifications("owner", userId) : Promise.resolve([]),
    ]);
    if (aResult.status === "fulfilled") setAgreements(aResult.value);
    else console.error("fetchAgreements failed:", aResult.reason);
    if (mResult.status === "fulfilled") setManagers(mResult.value);
    else console.error("fetchManagers failed:", mResult.reason);
    if (nResult.status === "fulfilled") {
      setNotifications(nResult.value);
      setUnreadCount(nResult.value.filter(x => !x.is_read).length);
    } else console.error("fetchNotifications failed:", nResult.reason);
    setLoading(false);
  }, [userId]);

  useEffect(() => { if (authed) loadAll(); }, [authed, loadAll]);

  const managersMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const mgr of managers) m.set(mgr.id, mgr.name);
    return m;
  }, [managers]);

  const getCreatorLabel = (a: DbAgreement) => {
    if (!a.manager_id) return "Owner";
    return managersMap.get(a.manager_id) || "Manager";
  };

  const pendingAgreements = useMemo(() => agreements.filter(a => a.status === "pending"), [agreements]);
  const monthCount = useMemo(() => {
    const now = new Date();
    return agreements.filter(a => {
      const d = new Date(a.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [agreements]);

  const filteredAgreements = useMemo(() => {
    let r = agreements;
    if (filterPg) r = r.filter(a => a.pg_name === filterPg);
    if (filterStatus) r = r.filter(a => a.status === filterStatus);
    if (agreementSearch.trim()) {
      const q = agreementSearch.toLowerCase();
      r = r.filter(a =>
        a.student_name.toLowerCase().includes(q) ||
        (a.student_phone || "").toLowerCase().includes(q) ||
        a.pg_name.toLowerCase().includes(q) ||
        (a.room_number || "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [agreements, filterPg, filterStatus, agreementSearch]);

  if (!authed) return null;

  const handleApprove = async (id: string) => {
    try {
      await approveAgreement(id, userId);
      const agreement = agreements.find(a => a.id === id);
      if (agreement?.manager_id) {
        try {
          await createNotification({
            user_type: "manager",
            user_id: agreement.manager_id,
            title: "Agreement Approved",
            message: `Agreement for ${agreement.student_name} has been approved`,
            agreement_id: id,
          });
        } catch (e) { console.warn("Notification failed:", e); }
      }
      setSuccessMsg("Agreement approved");
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadAll();
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string };
      const msg = err?.message || JSON.stringify(e);
      console.error("[handleApprove] error:", e);
      setErrorMsg("Approve failed: " + msg + (err?.details ? " — " + err.details : "") + (err?.hint ? " (hint: " + err.hint + ")" : ""));
      setTimeout(() => setErrorMsg(""), 15000);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    await rejectAgreement(rejectId, rejectReason);
    setRejectId(null);
    setRejectReason("");
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this agreement?")) return;
    await deleteAgreement(id);
    await loadAll();
  };

  const startFlow = () => {
    setSelected(null);
    setAgreementData(null);
    setEditingId(null);
    setStep(0);
    setView("flow");
  };

  const handleSelect = (s: Student) => {
    setSelected(s);
    if (editingId && agreementData) {
      setAgreementData({ ...agreementData, student: s });
    } else {
      setAgreementData(initialAgreement(s));
    }
  };

  const handleEdit = (a: DbAgreement) => {
    const ad = rowToAgreementData(a);
    setEditingId(a.id);
    setSelected(ad.student);
    setAgreementData(ad);
    setStep(1);
    setView("flow");
  };

  const handleDone = async (d: AgreementData) => {
    setSaving(true);
    try {
      if (editingId) {
        await updateAgreement(editingId, d);
        await approveAgreement(editingId, userId);
        const agreement = agreements.find(a => a.id === editingId);
        if (agreement?.manager_id) {
          try {
            await createNotification({
              user_type: "manager",
              user_id: agreement.manager_id,
              title: "Agreement Approved",
              message: `Agreement for ${d.student.name} has been approved`,
              agreement_id: editingId,
            });
          } catch (e) { console.warn("Notification failed:", e); }
        }
        generateAgreementPDF(d);
        setSuccessMsg("Agreement updated and approved");
      } else {
        await createAgreement(d, null, "approved");
        generateAgreementPDF(d);
        setSuccessMsg("Agreement created");
      }
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadAll();
      setEditingId(null);
      setView("home");
    } catch (e: unknown) {
      const err = e as { message?: string; details?: string; hint?: string };
      const msg = err?.message || JSON.stringify(e);
      console.error("[handleDone] error:", e);
      setErrorMsg(msg + (err?.details ? " — " + err.details : ""));
      setTimeout(() => setErrorMsg(""), 15000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddManager = async () => {
    if (!newMgr.name || !newMgr.phone || newMgr.pg_names.length === 0) return;
    setMgrAdding(true);
    setSuccessMsg("");
    try {
      await addManager({
        name: newMgr.name,
        email: newMgr.email,
        phone: newMgr.phone,
        pg_name: newMgr.pg_names.join(", "),
      });
      setNewMgr({ name: "", email: "", phone: "", pg_names: [] });
      const updatedManagers = await fetchManagers();
      setManagers(updatedManagers);
      setSuccessMsg("Manager added successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add manager";
      const display = (msg.includes("duplicate key") || msg.includes("unique") || msg.includes("already exists"))
        ? "A manager with this email or phone already exists."
        : msg;
      setErrorMsg(display);
      setTimeout(() => setErrorMsg(""), 5000);
    }
    setMgrAdding(false);
  };

  const handleToggleManager = async (m: DbManager) => {
    try {
      await toggleManagerActive(m.id, !m.active);
      await loadAll();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to update manager");
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  const handleDeleteManager = async (id: string) => {
    if (!confirm("Delete this manager?")) return;
    await deleteManager(id);
    await loadAll();
  };

  const startEditManager = (m: DbManager) => {
    setEditMgr({
      id: m.id,
      name: m.name,
      phone: m.phone,
      email: m.email || "",
      pg_names: m.pg_name.split(",").map(s => s.trim()).filter(Boolean),
    });
  };

  const handleSaveManager = async () => {
    if (!editMgr) return;
    if (!editMgr.name || !editMgr.phone || editMgr.pg_names.length === 0) return;
    setMgrSaving(true);
    try {
      await updateManager(editMgr.id, {
        name: editMgr.name,
        phone: editMgr.phone,
        email: editMgr.email,
        pg_name: editMgr.pg_names.join(", "),
      });
      setEditMgr(null);
      setSuccessMsg("Manager updated");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadAll();
    } catch (e) {
      const msg = (e as { message?: string })?.message || JSON.stringify(e);
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 10000);
    } finally {
      setMgrSaving(false);
    }
  };

  const generateDefaultTemplate = (): string => {
    const placeholder: AgreementData = {
      student: { name: "{RESIDENT_NAME}", dob: "", contactNumber: "{RESIDENT_PHONE}", email: "{RESIDENT_EMAIL}", permanentAddress: "{RESIDENT_ADDRESS}", age: "", collegeName: "", studentId: "", guardianName: "{PARENT_NAME}", guardianAddress: "{PARENT_ADDRESS}", guardianPhone: "{PARENT_PHONE}", guardianEmail: "{PARENT_EMAIL}", guardianAge: "", guardianRelation: "", aadhaarNumber: "", pgOption: "", paymentMode: "", declaration: "", timestamp: "", gender: "" },
      ownerName: "{OWNER_NAME}", ownerContact: "{OWNER_CONTACT}", ownerFatherName: "{OWNER_FATHER}", ownerAge: "{OWNER_AGE}", ownerAddress: "{OWNER_ADDRESS}",
      residentAge: "{RESIDENT_AGE}", residentCollege: "{COLLEGE}", residentStudentId: "{STUDENT_ID}", residentAadhaar: "",
      parentFatherName: "{PARENT_FATHER}", parentAge: "{PARENT_AGE}",
      pgName: "{PG_NAME}", pgAddress: "{PG_ADDRESS}", roomNumber: "{ROOM_NO}", monthlyRent: 0, paymentMode: "Monthly",
      startDate: "", endDate: "", securityDeposit: 0, maintenanceCharges: 0,
    };
    const formatSection = (s: AgreementSection) => {
      if (s.type === "header") return `\n=== ${s.text} ===\n`;
      if (s.type === "subheader") return s.text;
      if (s.type === "clause-title" || s.type === "section-title") return `\n--- ${s.text} ---`;
      if (s.type === "signature-row" && s.columns) return s.columns.join("\n\n");
      if (s.type === "signature-row") return `\n${s.text}`;
      if (s.type === "note") return "";
      return s.text;
    };
    return buildAgreementSections(placeholder).map(formatSection).join("\n\n");
  };

  const handleLoadTemplate = async () => {
    let loaded = false;
    try {
      const t = await fetchTemplate();
      if (t && t.trim().length > 10 && t !== "[]") {
        setTemplateText(t);
        loaded = true;
      }
    } catch (e) {
      console.error("Failed to load template from DB:", e);
    }
    if (!loaded) {
      setTemplateText(generateDefaultTemplate());
    }
  };

  const handleSaveTemplate = async () => {
    setTemplateStatus("");
    try {
      await saveTemplate(templateText, userId);
      setTemplateStatus("saved");
      setTimeout(() => setTemplateStatus(""), 3000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Template save failed:", e);
      setTemplateStatus(msg);
    }
  };

  const handleLogout = async () => {
    await ownerSignOut();
    navigate({ to: "/" });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead("owner", userId);
    await loadAll();
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-gold leading-none">Madilu PG</h1>
          <p className="text-white/50 text-sm mt-1 tracking-wide">Owner Dashboard</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => setView("notifications")} className="glass glass-hover rounded-xl px-3 py-2 text-sm relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>
            )}
          </button>
          {view !== "home" && (
            <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
          )}
          <button onClick={handleLogout} className="glass glass-hover rounded-xl px-4 py-2 text-sm text-red-300">Logout</button>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-sm mb-4 flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-emerald-300/60 hover:text-emerald-300 ml-3 shrink-0">&times;</button>
          </div>
        )}
        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm mb-4 flex items-center justify-between">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg("")} className="text-red-300/60 hover:text-red-300 ml-3 shrink-0">&times;</button>
          </div>
        )}
        {/* HOME */}
        {view === "home" && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid sm:grid-cols-4 gap-5">
              <StatCard label="Total Agreements" value={agreements.length} hint="All time" />
              <StatCard label="Pending Approval" value={pendingAgreements.length} hint="Action needed" />
              <StatCard label="This Month" value={monthCount} hint={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
              <StatCard label="Active Managers" value={managers.filter(m => m.active).length} hint={`${managers.length} total`} />
            </div>

            {pendingAgreements.length > 0 && (
              <div className="glass rounded-3xl p-7 border border-yellow-500/20">
                <h3 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                  Pending Approvals
                </h3>
                <div className="space-y-2">
                  {pendingAgreements.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{a.student_name}</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          <span className="text-[#F5D799]">{a.pg_name}</span>
                          {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
                          <span className="mx-1 text-white/20">·</span>Rs. {inr(a.monthly_rent)}/mo
                          <span className="mx-1 text-white/20">·</span><span className="text-[#4ECDC4]/70">by {getCreatorLabel(a)}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleEdit(a)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">View</button>
                        <button onClick={() => handleApprove(a.id)} className="rounded-lg px-3 py-2 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 transition">Approve</button>
                        <button onClick={() => { setRejectId(a.id); setRejectReason(""); }} className="rounded-lg px-3 py-2 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Reject</button>
                      </div>
                    </div>
                  ))}
                  {pendingAgreements.length > 5 && (
                    <button onClick={() => setView("pending")} className="w-full text-center text-xs text-white/40 hover:text-white/60 py-2">View all {pendingAgreements.length} pending →</button>
                  )}
                </div>
              </div>
            )}

            <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #D4A853, transparent 70%)" }} />
              <div className="relative">
                <h2 className="font-display text-4xl sm:text-5xl font-bold">Owner <span className="text-gold">Controls</span></h2>
                <p className="text-white/60 mt-3 max-w-xl mx-auto">Create agreements directly, manage your team, or edit the agreement template.</p>
                <div className="flex justify-center gap-3 mt-7 flex-wrap">
                  <button onClick={startFlow} className="btn-gold rounded-xl px-6 py-4 text-base font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    Create Agreement
                  </button>
                  <button onClick={() => setView("extension-pick")} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium flex items-center gap-2 border border-[#D4A853]/20">
                    <svg className="w-5 h-5 text-[#D4A853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>
                    Tenure Extension
                  </button>
                  <button onClick={() => setView("exit-pick")} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium flex items-center gap-2 border border-[#D4A853]/20">
                    <svg className="w-5 h-5 text-[#D4A853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    Exit Certificate
                  </button>
                </div>
                <div className="flex justify-center gap-3 mt-3 flex-wrap">
                  <button onClick={() => setView("agreements")} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium">All Agreements</button>
                  <button onClick={() => setView("managers")} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium">Managers</button>
                  <button onClick={() => { setView("template"); handleLoadTemplate(); }} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium">Template</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PENDING VIEW */}
        {view === "pending" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-bold">Pending Approvals</h2>
              <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
            </div>
            <div className="glass rounded-3xl p-6 space-y-2">
              {pendingAgreements.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.student_name}</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      <span className="text-[#F5D799]">{a.pg_name}</span>
                      {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
                      <span className="mx-1 text-white/20">·</span>Rs. {inr(a.monthly_rent)}/mo
                      <span className="mx-1 text-white/20">·</span><span className="font-mono">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEdit(a)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">View</button>
                    <button onClick={() => handleApprove(a.id)} className="rounded-lg px-3 py-2 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 transition">Approve</button>
                    <button onClick={() => { setRejectId(a.id); setRejectReason(""); }} className="rounded-lg px-3 py-2 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL AGREEMENTS */}
        {view === "agreements" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-display text-3xl font-bold">All Agreements</h2>
              <div className="flex gap-2">
                <button onClick={() => loadAll()} className="glass glass-hover rounded-xl px-4 py-2 text-sm">↻ Refresh</button>
                <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
              </div>
            </div>
            <input
              className={inputCls + " mb-1"}
              placeholder="Search by name, phone, PG, or room..."
              value={agreementSearch}
              onChange={e => setAgreementSearch(e.target.value)}
            />
            <div className="flex gap-3 flex-wrap">
              <Select value={filterPg || "__all__"} onValueChange={v => setFilterPg(v === "__all__" ? "" : v)}>
                <SelectTrigger className={triggerCls + " w-auto min-w-[160px] h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl max-h-[300px]">
                  <SelectItem value="__all__" className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">All PGs</SelectItem>
                  {PG_LIST.map(p => (
                    <SelectItem key={p} value={p} className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus || "__all__"} onValueChange={v => setFilterStatus(v === "__all__" ? "" : v)}>
                <SelectTrigger className={triggerCls + " w-auto min-w-[140px] h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl">
                  <SelectItem value="__all__" className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">All Statuses</SelectItem>
                  <SelectItem value="pending" className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">Pending</SelectItem>
                  <SelectItem value="approved" className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">Approved</SelectItem>
                  <SelectItem value="rejected" className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <span className="self-center text-xs text-white/40">{filteredAgreements.length} results</span>
            </div>
            <div className="glass rounded-3xl p-6">
              {filteredAgreements.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No agreements match your filters.</div>
              ) : (
                <div className="space-y-2">
                  {filteredAgreements.map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{a.student_name}</p>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{a.status}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          <span className="text-[#F5D799]">{a.pg_name}</span>
                          {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
                          <span className="mx-1 text-white/20">·</span><span className="font-mono">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                          {a.monthly_rent > 0 && <><span className="mx-1 text-white/20">·</span><span className="font-mono text-[#4ECDC4]">Rs. {inr(a.monthly_rent)}/mo</span></>}
                          <span className="mx-1 text-white/20">·</span><span className="text-[#4ECDC4]/70">by {getCreatorLabel(a)}</span>
                        </p>
                        {a.status === "rejected" && a.rejection_reason && (
                          <p className="text-xs text-red-300 mt-1">Reason: {a.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {a.status === "pending" && (
                          <>
                            <button onClick={() => handleApprove(a.id)} className="rounded-lg px-3 py-2 text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 transition">Approve</button>
                            <button onClick={() => { setRejectId(a.id); setRejectReason(""); }} className="rounded-lg px-3 py-2 text-xs bg-red-500/20 text-red-300 hover:bg-red-500/30 transition">Reject</button>
                          </>
                        )}
                        <button onClick={() => handleEdit(a)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">Edit</button>
                        <button onClick={() => generateAgreementPDF(rowToAgreementData(a))} className="glass glass-hover rounded-lg px-3 py-2 text-xs">PDF</button>
                        <button onClick={() => handleDelete(a.id)} className="rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition">Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MANAGERS */}
        {view === "managers" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl font-bold">Manage Team</h2>
              <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
            </div>
            <div className="glass rounded-3xl p-6">
              <h3 className="font-display text-xl font-semibold mb-4">Add New Manager</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <input className={inputCls} placeholder="Full Name *" value={newMgr.name} onChange={e => setNewMgr({ ...newMgr, name: e.target.value })} />
                <input className={inputCls} placeholder="Phone *" value={newMgr.phone} onChange={e => setNewMgr({ ...newMgr, phone: e.target.value })} />
                <input className={inputCls} placeholder="Email" value={newMgr.email} onChange={e => setNewMgr({ ...newMgr, email: e.target.value })} />
              </div>
              <div className="mb-4">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Assign PG(s) *</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {PG_LIST.map(p => {
                    const checked = newMgr.pg_names.includes(p);
                    return (
                      <label key={p} className={`flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-2 text-sm transition-all ${checked ? "border-[#D4A853] bg-[#D4A853]/10" : "border-white/10 hover:border-white/20"}`}>
                        <input
                          type="checkbox"
                          className="accent-[#D4A853]"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? newMgr.pg_names.filter(x => x !== p)
                              : [...newMgr.pg_names, p];
                            setNewMgr({ ...newMgr, pg_names: next });
                          }}
                        />
                        {p}
                      </label>
                    );
                  })}
                </div>
              </div>
              <button onClick={handleAddManager} disabled={mgrAdding || !newMgr.name || !newMgr.phone || newMgr.pg_names.length === 0} className="btn-gold rounded-xl px-6 py-2.5 text-sm disabled:opacity-40">
                {mgrAdding ? "Adding..." : "Add Manager"}
              </button>
              {successMsg && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 p-3 text-sm">{successMsg}</div>
              )}
            </div>

            <div className="glass rounded-3xl p-6">
              <h3 className="font-display text-xl font-semibold mb-4">All Managers ({managers.length})</h3>
              {managers.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No managers added yet.</div>
              ) : (
                <div className="space-y-2">
                  {managers.map(m => editMgr?.id === m.id ? (
                    <div key={m.id} className="rounded-xl border border-[#D4A853]/30 bg-[#D4A853]/5 p-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input className={inputCls} placeholder="Full Name *" value={editMgr.name} onChange={e => setEditMgr({ ...editMgr, name: e.target.value })} />
                        <input className={inputCls} placeholder="Phone *" value={editMgr.phone} onChange={e => setEditMgr({ ...editMgr, phone: e.target.value })} />
                        <input className={inputCls} placeholder="Email" value={editMgr.email} onChange={e => setEditMgr({ ...editMgr, email: e.target.value })} />
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Assigned PG(s) *</span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {PG_LIST.map(p => {
                            const checked = editMgr.pg_names.includes(p);
                            return (
                              <label key={p} className={`flex items-center gap-2 cursor-pointer rounded-xl border px-3 py-2 text-sm transition-all ${checked ? "border-[#D4A853] bg-[#D4A853]/10" : "border-white/10 hover:border-white/20"}`}>
                                <input type="checkbox" className="accent-[#D4A853]" checked={checked} onChange={() => {
                                  const next = checked ? editMgr.pg_names.filter(x => x !== p) : [...editMgr.pg_names, p];
                                  setEditMgr({ ...editMgr, pg_names: next });
                                }} />
                                {p}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditMgr(null)} className="glass glass-hover rounded-lg px-4 py-2 text-xs">Cancel</button>
                        <button onClick={handleSaveManager} disabled={mgrSaving || !editMgr.name || !editMgr.phone || editMgr.pg_names.length === 0} className="btn-gold rounded-lg px-4 py-2 text-xs disabled:opacity-40">
                          {mgrSaving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition ${m.active ? "border-white/5 bg-white/[0.02]" : "border-red-500/10 bg-red-500/5 opacity-60"}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{m.name}</p>
                          {!m.active && <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">inactive</span>}
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          <span className="font-mono">{m.phone}</span>
                          {m.email && <><span className="mx-1 text-white/20">·</span>{m.email}</>}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.pg_name.split(",").map(pg => pg.trim()).filter(Boolean).map(pg => (
                            <span key={pg} className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4A853]/15 text-[#F5D799]">{pg}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEditManager(m)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">Edit</button>
                        <button onClick={() => handleToggleManager(m)} className={`glass glass-hover rounded-lg px-3 py-2 text-xs ${m.active ? "text-yellow-300" : "text-green-300"}`}>
                          {m.active ? "Deactivate" : "Activate"}
                        </button>
                        <button onClick={() => handleDeleteManager(m.id)} className="rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TEMPLATE */}
        {view === "template" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold">Agreement Template</h2>
                <p className="text-white/50 text-sm mt-1">Edit clause text. Dynamic fields are filled from form data.</p>
              </div>
              <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
            </div>
            <div className="glass rounded-3xl p-6">
              <textarea
                value={templateText}
                onChange={e => setTemplateText(e.target.value)}
                className="input-glow w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono leading-relaxed min-h-[500px] resize-y placeholder:text-white/30"
              />
              <div className="flex justify-end mt-4 gap-3 items-center">
                {templateStatus === "saved" && <span className="text-[#4ECDC4] text-sm">Template saved successfully</span>}
                {templateStatus && templateStatus !== "saved" && <span className="text-red-400 text-sm max-w-xs truncate">{templateStatus}</span>}
                <button onClick={handleSaveTemplate} className="btn-gold rounded-xl px-6 py-3 text-sm font-semibold">Save Template</button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {view === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold">Notifications</h2>
                <p className="text-white/50 text-sm mt-1">{unreadCount} unread</p>
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && <button onClick={handleMarkAllRead} className="glass glass-hover rounded-xl px-4 py-2 text-sm">Mark all read</button>}
                <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
              </div>
            </div>
            <div className="glass rounded-3xl p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No notifications yet.</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className={`rounded-xl border p-4 ${n.is_read ? "border-white/5 bg-white/[0.02]" : "border-[#D4A853]/20 bg-[#D4A853]/5"}`}>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-xs text-white/50 mt-1">{n.message}</p>
                      <p className="text-xs text-white/30 mt-1 font-mono">{new Date(n.created_at).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AGREEMENT FLOW */}
        {view === "flow" && (
          <div>
            <Stepper current={step} />
            {step === 0 && <StudentStep selected={selected} onSelect={handleSelect} onNext={() => agreementData && setStep(1)} />}
            {step === 1 && agreementData && <DetailsStep data={agreementData} setData={setAgreementData} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
            {step === 2 && agreementData && (
              <PreviewStep
                data={agreementData}
                onBack={() => setStep(1)}
                onDone={() => handleDone(agreementData)}
                saving={saving}
                submitLabel={editingId ? "Update & Approve" : "Create & Approve"}
              />
            )}
          </div>
        )}

        {/* EXTENSION FLOW */}
        {view === "extension-pick" && (
          <AgreementStudentPicker
            title="Tenure Extension"
            onBack={() => setView("home")}
            onSelect={(a) => { setSecondaryDoc(a); setView("extension-preview"); }}
          />
        )}
        {view === "extension-preview" && secondaryDoc && (
          <SecondaryDocPreview agreement={secondaryDoc} docType="extension" onBack={() => setView("extension-pick")} />
        )}

        {/* EXIT FLOW */}
        {view === "exit-pick" && (
          <AgreementStudentPicker
            title="Exit / No-Dues Certificate"
            onBack={() => setView("home")}
            onSelect={(a) => { setSecondaryDoc(a); setView("exit-preview"); }}
          />
        )}
        {view === "exit-preview" && secondaryDoc && (
          <SecondaryDocPreview agreement={secondaryDoc} docType="exit" onBack={() => setView("exit-pick")} />
        )}

        {/* REJECT MODAL */}
        {rejectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectId(null)}>
            <div className="glass rounded-3xl p-8 max-w-md w-full mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-2xl font-bold mb-4">Reject Agreement</h3>
              <label className="block mb-4">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Reason (optional)</span>
                <textarea className={inputCls + " mt-1.5 min-h-[100px] resize-y"} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide reason for rejection..." />
              </label>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setRejectId(null)} className="glass glass-hover rounded-xl px-5 py-2.5 text-sm">Cancel</button>
                <button onClick={handleReject} className="rounded-xl px-5 py-2.5 text-sm bg-red-500/20 text-red-300 hover:bg-red-500/30 transition font-semibold">Reject</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center text-white/30 text-xs pb-6 font-mono">
        Madilu PG · Bangalore · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
