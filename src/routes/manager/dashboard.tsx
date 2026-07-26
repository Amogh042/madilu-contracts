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
import { getManagerSession, clearManagerSession } from "@/lib/auth";
import { createAgreement, fetchAgreements, updateAgreement, rowToAgreementData, type DbAgreement } from "@/lib/agreements-db";
import { fetchNotifications, markAllNotificationsRead, createNotification, type DbNotification } from "@/lib/notifications-db";
import { PG_ADDRESSES } from "@/lib/pg-data";
import type { AgreementData, Student } from "@/lib/pg-data";

export const Route = createFileRoute("/manager/dashboard")({
  component: ManagerDashboard,
});

const inr = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n || 0));

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-300",
  approved: "bg-green-500/15 text-green-300",
  rejected: "bg-red-500/15 text-red-300",
};

const initialAgreement = (s: Student, pgName?: string): AgreementData => {
  const pmRaw = (s.paymentMode || "").toLowerCase();
  const paymentMode: AgreementData["paymentMode"] =
    pmRaw.includes("annual") || pmRaw.includes("instalment") || pmRaw.includes("installment") ? "Instalments" : "Monthly";
  return {
    student: s,
    ownerName: "", ownerContact: "", ownerFatherName: "", ownerAge: "", ownerAddress: "",
    residentAge: "", residentCollege: "", residentStudentId: "",
    parentFatherName: "", parentAge: "",
    pgName: pgName || "", pgAddress: PG_ADDRESSES[pgName || ""] || "", roomNumber: "",
    monthlyRent: 0, paymentMode, startDate: "", endDate: "",
    securityDeposit: 0, maintenanceCharges: 0,
  };
};

function ManagerDashboard() {
  const navigate = useNavigate();
  const session = getManagerSession();

  useEffect(() => {
    if (!session) navigate({ to: "/manager/login" });
  }, [session, navigate]);

  const [view, setView] = useState<"home" | "flow" | "history" | "notifications" | "extension-pick" | "extension-preview" | "exit-pick" | "exit-preview">("home");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Student | null>(null);
  const [data, setData] = useState<AgreementData | null>(null);
  const [agreements, setAgreements] = useState<DbAgreement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [secondaryDoc, setSecondaryDoc] = useState<DbAgreement | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadAgreements = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await fetchAgreements({ manager_id: session.id });
      setAgreements(data);
    } catch (e) { console.error("loadAgreements failed:", e); }
    setLoading(false);
  }, [session?.id]);

  const loadNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const n = await fetchNotifications("manager", session.id);
      setNotifications(n);
      setUnreadCount(n.filter(x => !x.is_read).length);
    } catch (e) { console.error("loadNotifications failed:", e); }
  }, [session?.id]);

  useEffect(() => { loadAgreements(); loadNotifications(); }, [loadAgreements, loadNotifications]);

  const monthCount = useMemo(() => {
    const now = new Date();
    return agreements.filter(a => {
      const d = new Date(a.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [agreements]);

  const pendingCount = useMemo(() => agreements.filter(a => a.status === "pending").length, [agreements]);

  if (!session) return null;

  const startFlow = () => {
    setSelected(null);
    setData(null);
    setEditingId(null);
    setStep(0);
    setView("flow");
  };

  const handleSelect = (s: Student) => {
    setSelected(s);
    if (editingId && data) {
      setData({ ...data, student: s });
    } else {
      const singlePg = session.pgNames.length === 1 ? session.pgNames[0] : undefined;
      setData(initialAgreement(s, singlePg));
    }
  };

  const handleEdit = (a: DbAgreement) => {
    const ad = rowToAgreementData(a);
    setEditingId(a.id);
    setSelected(ad.student);
    setData(ad);
    setStep(1);
    setView("flow");
  };

  const handleDone = async (d: AgreementData) => {
    setSaving(true);
    try {
      if (editingId) {
        await updateAgreement(editingId, d);
        setSuccessMsg("Agreement updated successfully");
      } else {
        const created = await createAgreement(d, session.id, "pending");
        await createNotification({
          user_type: "owner",
          user_id: "owner",
          title: "New Agreement for Approval",
          message: `${session.name} created an agreement for ${d.student.name}`,
          agreement_id: created.id,
        });
        setSuccessMsg("Agreement submitted for approval");
      }
      setTimeout(() => setSuccessMsg(""), 5000);
      await loadAgreements();
      setEditingId(null);
      setView("home");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to save agreement");
      setTimeout(() => setErrorMsg(""), 5000);
    }
    setSaving(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead("manager", session.id);
    await loadNotifications();
  };

  const handleLogout = () => {
    clearManagerSession();
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen">
      <Background />
      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-gold leading-none">Madilu PG</h1>
          <p className="text-white/50 text-sm mt-1 tracking-wide">Manager — {session.name} · {session.pgNames.join(", ")}</p>
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => { setView("notifications"); }} className="glass glass-hover rounded-xl px-3 py-2 text-sm relative">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount}</span>
            )}
          </button>
          {view !== "home" && (
            <button onClick={() => { setView("home"); setEditingId(null); }} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
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
        {view === "home" && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid sm:grid-cols-3 gap-5">
              <StatCard label="My Agreements" value={agreements.length} hint="All time" />
              <StatCard label="Pending Approval" value={pendingCount} hint="Awaiting owner" />
              <StatCard label="This Month" value={monthCount} hint={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
            </div>

            <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #4ECDC4, transparent 70%)" }} />
              <div className="relative">
                <h2 className="font-display text-4xl sm:text-5xl font-bold">Create a new <span className="text-gold">agreement</span></h2>
                <p className="text-white/60 mt-3 max-w-xl mx-auto">Agreements you create will be sent to the owner for approval.</p>
                <div className="flex justify-center gap-3 mt-7 flex-wrap">
                  <button onClick={startFlow} className="btn-gold rounded-xl px-6 py-4 text-base font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    New Agreement
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
                <div className="flex justify-center gap-3 mt-3">
                  <button onClick={() => setView("history")} className="glass glass-hover rounded-xl px-6 py-4 text-base font-medium">My Agreements</button>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-7">
              <h3 className="font-display text-2xl font-semibold mb-5">Recent Agreements</h3>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="glass rounded-xl p-4 h-16 animate-pulse" />)}</div>
              ) : agreements.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No agreements yet — create your first one above.</div>
              ) : (
                <div className="space-y-2">
                  {agreements.slice(0, 8).map(a => (
                    <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{a.student_name}</p>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{a.status}</span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          <span className="text-[#F5D799]">{a.pg_name}</span>
                          {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
                          <span className="mx-1 text-white/20">·</span>
                          <span className="font-mono">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                          {a.monthly_rent > 0 && <><span className="mx-1 text-white/20">·</span><span className="font-mono text-[#4ECDC4]">Rs. {inr(a.monthly_rent)}/mo</span></>}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {a.status === "pending" && (
                          <button onClick={() => handleEdit(a)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">Edit</button>
                        )}
                        {a.status === "approved" && (
                          <button onClick={() => generateAgreementPDF(rowToAgreementData(a))} className="glass glass-hover rounded-lg px-3 py-2 text-xs">PDF</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {agreements.length > 8 && (
                    <button onClick={() => setView("history")} className="w-full text-center text-xs text-white/40 hover:text-white/60 py-2">View all {agreements.length} →</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "history" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-display text-3xl font-bold">My Agreements</h2>
                <p className="text-white/50 text-sm mt-1">{agreements.length} total</p>
              </div>
              <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
            </div>
            <div className="glass rounded-3xl p-6">
              <div className="space-y-2">
                {agreements.map(a => (
                  <div key={a.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{a.student_name}</p>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${statusColors[a.status]}`}>{a.status}</span>
                      </div>
                      <p className="text-xs text-white/50 mt-0.5">
                        <span className="text-[#F5D799]">{a.pg_name}</span>
                        {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
                        <span className="mx-1 text-white/20">·</span>
                        <span className="font-mono">{new Date(a.created_at).toLocaleDateString("en-IN")}</span>
                        {a.monthly_rent > 0 && <><span className="mx-1 text-white/20">·</span><span className="font-mono text-[#4ECDC4]">Rs. {inr(a.monthly_rent)}/mo</span></>}
                      </p>
                      {a.status === "rejected" && a.rejection_reason && (
                        <p className="text-xs text-red-300 mt-1">Reason: {a.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {a.status === "pending" && <button onClick={() => handleEdit(a)} className="glass glass-hover rounded-lg px-3 py-2 text-xs">Edit</button>}
                      {a.status === "approved" && <button onClick={() => generateAgreementPDF(rowToAgreementData(a))} className="glass glass-hover rounded-lg px-3 py-2 text-xs">PDF</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between gap-4 flex-wrap">
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
                    <div key={n.id} className={`rounded-xl border p-4 transition ${n.is_read ? "border-white/5 bg-white/[0.02]" : "border-[#D4A853]/20 bg-[#D4A853]/5"}`}>
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

        {view === "flow" && (
          <div>
            <Stepper current={step} />
            {step === 0 && (
              <StudentStep selected={selected} onSelect={handleSelect} onNext={() => data && setStep(1)} />
            )}
            {step === 1 && data && (
              <DetailsStep data={data} setData={setData} onBack={() => setStep(0)} onNext={() => setStep(2)} allowedPgs={session.pgNames} />
            )}
            {step === 2 && data && (
              <PreviewStep
                data={data}
                onBack={() => setStep(1)}
                onDone={() => handleDone(data)}
                saving={saving}
                submitLabel={editingId ? "Update Agreement" : "Submit for Approval"}
                hidePdf
              />
            )}
          </div>
        )}

        {/* EXTENSION FLOW */}
        {view === "extension-pick" && (
          <AgreementStudentPicker
            title="Tenure Extension"
            managerId={session.id}
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
            managerId={session.id}
            onBack={() => setView("home")}
            onSelect={(a) => { setSecondaryDoc(a); setView("exit-preview"); }}
          />
        )}
        {view === "exit-preview" && secondaryDoc && (
          <SecondaryDocPreview agreement={secondaryDoc} docType="exit" onBack={() => setView("exit-pick")} />
        )}
      </main>

      <footer className="relative z-10 text-center text-white/30 text-xs pb-6 font-mono">
        Madilu PG · Bangalore · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
