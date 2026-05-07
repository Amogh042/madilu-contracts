import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Background } from "@/components/agreement/Background";
import { StatCard } from "@/components/agreement/StatCard";
import { Stepper } from "@/components/agreement/Stepper";
import { StudentStep } from "@/components/agreement/StudentStep";
import { DetailsStep } from "@/components/agreement/DetailsStep";
import { PreviewStep } from "@/components/agreement/PreviewStep";
import { generateAgreementPDF } from "@/lib/generate-pdf";
import type { AgreementData, Student, StoredAgreement } from "@/lib/pg-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Madilu PG — Agreement Generator" },
      { name: "description", content: "Premium PG rental agreement generator for Madilu PG accommodations in Bangalore." },
    ],
  }),
  component: Index,
});

const HISTORY_KEY = "madilu_agreements_v1";
const OWNER_KEY = "madilu_owner_defaults_v1";

const emptyStudent: Student = {
  name: "", dob: "", phone: "", email: "", pg: "", permanentAddress: "",
  parentName: "", parentAddress: "", parentPhone: "", parentEmail: "",
  paymentMode: "", declaration: "", timestamp: "",
};

const initialAgreement = (s: Student, owner: { name: string; contact: string }): AgreementData => {
  const pgFromSheet = s.pg && s.pg.trim();
  const today = new Date().toISOString().slice(0, 10);
  const end = new Date(); end.setMonth(end.getMonth() + 11);
  const pmRaw = (s.paymentMode || "").toLowerCase();
  const paymentMode: AgreementData["paymentMode"] =
    pmRaw.includes("2") || pmRaw.includes("two") ? "Annual 2 Instalments"
    : pmRaw.includes("annual") || pmRaw.includes("1") || pmRaw.includes("one") ? "Annual 1 Instalment"
    : "Monthly";
  return {
    student: s,
    ownerName: owner.name || "Smt. Rajeshwari",
    ownerContact: owner.contact || "",
    pgName: pgFromSheet || "",
    pgAddress: "",
    roomNumber: "",
    monthlyRent: 0,
    paymentMode,
    startDate: today,
    endDate: end.toISOString().slice(0, 10),
    securityDeposit: 0,
    maintenanceCharges: 0,
  };
};

function Index() {
  const [view, setView] = useState<"home" | "flow">("home");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Student | null>(null);
  const [data, setData] = useState<AgreementData | null>(null);
  const [history, setHistory] = useState<StoredAgreement[]>([]);
  const [studentCount, setStudentCount] = useState<number | string>("—");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  // Try to update student count opportunistically
  useEffect(() => {
    import("@/lib/fetch-students").then(({ fetchStudents }) =>
      fetchStudents().then(s => setStudentCount(s.length)).catch(() => {})
    );
  }, []);

  const monthCount = useMemo(() => {
    const now = new Date();
    return history.filter(h => {
      const d = new Date(h.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [history]);

  const startFlow = () => {
    setSelected(null);
    setData(null);
    setStep(0);
    setView("flow");
  };

  const handleSelect = (s: Student) => {
    setSelected(s);
    let owner = { name: "", contact: "" };
    try { const raw = localStorage.getItem(OWNER_KEY); if (raw) owner = JSON.parse(raw); } catch {}
    setData(initialAgreement(s, owner));
  };

  const persistAgreement = (d: AgreementData) => {
    const entry: StoredAgreement = { id: String(Date.now()), createdAt: new Date().toISOString(), data: d };
    const next = [entry, ...history].slice(0, 50);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    localStorage.setItem(OWNER_KEY, JSON.stringify({ name: d.ownerName, contact: d.ownerContact }));
  };

  return (
    <div className="relative min-h-screen">
      <Background />

      <header className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-gold leading-none">Madilu PG</h1>
          <p className="text-white/50 text-sm mt-1 tracking-wide">Agreement Generator</p>
        </div>
        {view === "flow" && (
          <button onClick={() => setView("home")} className="glass glass-hover rounded-xl px-4 py-2 text-sm">← Dashboard</button>
        )}
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        {view === "home" ? (
          <div className="space-y-8 animate-fade-in">
            <div className="grid sm:grid-cols-3 gap-5">
              <StatCard label="Total Students" value={studentCount} hint="Synced from sheet" />
              <StatCard label="Agreements Generated" value={history.length} hint="All time" />
              <StatCard label="This Month" value={monthCount} hint={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
            </div>

            <div className="glass rounded-3xl p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-30" style={{ background: "radial-gradient(circle, #D4A853, transparent 70%)" }} />
              <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #4ECDC4, transparent 70%)" }} />
              <div className="relative">
                <h2 className="font-display text-4xl sm:text-5xl font-bold">Create a new <span className="text-gold">agreement</span></h2>
                <p className="text-white/60 mt-3 max-w-xl mx-auto">Pull tenant data from your Google Sheet, fill in PG and payment terms, and download a stamp-paper-ready PDF in minutes.</p>
                <button onClick={startFlow} className="btn-gold rounded-xl px-8 py-4 mt-7 text-base font-semibold">
                  ✨ Generate New Agreement
                </button>
              </div>
            </div>

            <div className="glass rounded-3xl p-7">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-2xl font-semibold">Recent Agreements</h3>
                {history.length > 0 && (
                  <button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                    className="text-xs text-white/40 hover:text-red-300 transition">Clear all</button>
                )}
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 text-white/40 text-sm">No agreements yet — generate your first one above.</div>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 8).map(h => (
                    <div key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.05] transition">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{h.data.student.name}</p>
                        <p className="text-xs text-white/50 mt-0.5">
                          <span className="text-[#F5D799]">{h.data.pgName}</span>
                          <span className="mx-2 text-white/20">•</span>
                          <span className="font-mono">{new Date(h.createdAt).toLocaleDateString("en-IN")}</span>
                        </p>
                      </div>
                      <button onClick={() => generateAgreementPDF(h.data)} className="glass glass-hover rounded-lg px-3 py-2 text-xs whitespace-nowrap">
                        ⬇ Re-download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Stepper current={step} />
            {step === 0 && (
              <StudentStep selected={selected} onSelect={handleSelect} onNext={() => data && setStep(1)} />
            )}
            {step === 1 && data && (
              <DetailsStep data={data} setData={setData} onBack={() => setStep(0)} onNext={() => setStep(2)} />
            )}
            {step === 2 && data && (
              <PreviewStep data={data} onBack={() => setStep(1)} onDone={() => { persistAgreement(data); setView("home"); }} />
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center text-white/30 text-xs pb-6 font-mono">
        Madilu PG · Bangalore · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
