import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { fetchStudents } from "@/lib/fetch-students";
import { PG_LIST } from "@/lib/pg-data";
import type { Student } from "@/lib/pg-data";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type Props = {
  selected: Student | null;
  onSelect: (s: Student) => void;
  onNext: () => void;
};

const inputCls =
  "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all";
const triggerCls =
  "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-all hover:border-[#D4A853]/40 data-[state=open]:border-[#D4A853]/60 data-[placeholder]:text-white/40";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-wider text-white/50 font-medium">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

const parseTimestamp = (ts: string): number => {
  if (!ts) return 0;
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.getTime();
  const parts = ts.match(
    /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\s*(\d{1,2}):(\d{2}):?(\d{2})?\s*(AM|PM)?/i,
  );
  if (!parts) return 0;
  const [, day, month, year, hours, mins, secs, ampm] = parts;
  let y = Number(year);
  if (y < 100) y += 2000;
  let h = Number(hours);
  if (ampm) {
    if (ampm.toUpperCase() === "PM" && h < 12) h += 12;
    if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
  }
  return new Date(y, Number(month) - 1, Number(day), h, Number(mins), Number(secs || 0)).getTime();
};

export function StudentStep({ selected, onSelect, onNext }: Props) {
  const [mode, setMode] = useState<"sheet" | "manual">("sheet");
  const [viewMode, setViewMode] = useState<"box" | "list">("box");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [manual, setManual] = useState<Student>({
    timestamp: "",
    name: "",
    dob: "",
    contactNumber: "",
    email: "",
    permanentAddress: "",
    age: "",
    collegeName: "",
    studentId: "",
    guardianName: "",
    guardianAddress: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianAge: "",
    guardianRelation: "",
    aadhaarNumber: "",
    pgOption: "",
    paymentMode: "",
    declaration: "",
    gender: "",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudents();
      data.sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));
      setStudents(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.contactNumber.includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.pgOption.toLowerCase().includes(term),
    );
  }, [q, students]);

  const updateManual = (field: keyof Student, value: string) => {
    const updated = { ...manual, [field]: value };
    setManual(updated);
    onSelect(updated);
  };

  const manualValid = manual.name.trim().length > 0;

  const isSel = (s: Student) =>
    selected?.name === s.name && selected?.contactNumber === s.contactNumber;

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-bold">Select Student</h2>
          <p className="text-white/50 text-sm mt-1">
            {mode === "sheet"
              ? "Choose from records synced via Google Sheets"
              : "Enter student details manually"}
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "sheet" && (
            <>
              <div className="flex rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setViewMode("box")}
                  className={`px-3 py-2 transition-all ${viewMode === "box" ? "bg-[#D4A853]/20 text-[#F5D799]" : "text-white/40 hover:text-white/60"}`}
                  title="Box View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 transition-all ${viewMode === "list" ? "bg-[#D4A853]/20 text-[#F5D799]" : "text-white/40 hover:text-white/60"}`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="glass glass-hover rounded-xl px-4 py-2 text-sm font-medium"
              >
                {loading ? "Refreshing…" : "↻ Refresh List"}
              </button>
            </>
          )}
          <button
            onClick={() => setMode(mode === "sheet" ? "manual" : "sheet")}
            className="glass glass-hover rounded-xl px-4 py-2 text-sm font-medium"
          >
            {mode === "sheet" ? "✎ Enter Manually" : "← Back to List"}
          </button>
        </div>
      </div>

      {mode === "sheet" ? (
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, phone, email, PG…"
            className="input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 mb-6"
          />

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 text-sm mb-4">
              {error}
            </div>
          )}

          <div
            className="max-h-[420px] overflow-y-auto pr-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(212,168,83,0.3) transparent" }}
          >
            {loading && (
              <div className={viewMode === "box" ? "grid sm:grid-cols-2 gap-3" : "space-y-1"}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`glass animate-pulse ${viewMode === "box" ? "rounded-xl p-4 h-24" : "rounded-lg h-12"}`}
                  />
                ))}
              </div>
            )}
            {!loading && filtered.length === 0 && !error && (
              <div className="text-center text-white/40 py-12 text-sm">No students found.</div>
            )}

            {!loading && filtered.length > 0 && viewMode === "box" && (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(s)}
                    className={`glass glass-hover rounded-xl p-4 text-left transition-all ${isSel(s) ? "ring-2 ring-[#D4A853]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold truncate">{s.name}</p>
                        <p className="text-xs text-white/60 mt-0.5 font-mono">{s.contactNumber}</p>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{s.email}</p>
                      </div>
                      {s.pgOption && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[#D4A853]/15 text-[#F5D799] whitespace-nowrap">
                          {s.pgOption}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!loading && filtered.length > 0 && viewMode === "list" && (
              <div className="space-y-1">
                {filtered.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(s)}
                    className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-lg text-left transition-all hover:bg-white/[0.04] ${isSel(s) ? "ring-2 ring-[#D4A853] bg-[#D4A853]/5" : ""}`}
                  >
                    <p className="font-medium text-sm truncate min-w-0 flex-1">{s.name}</p>
                    {s.pgOption && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4A853]/15 text-[#F5D799] whitespace-nowrap shrink-0">
                        {s.pgOption}
                      </span>
                    )}
                    <p className="text-xs text-white/50 font-mono shrink-0">{s.contactNumber}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-display text-xl text-gold">Student</h3>
            <Field label="Full Name *">
              <input
                className={inputCls}
                value={manual.name}
                onChange={(e) => updateManual("name", e.target.value)}
                placeholder="Full Name"
              />
            </Field>
            <Field label="Date of Birth">
              <input
                className={inputCls}
                value={manual.dob}
                onChange={(e) => updateManual("dob", e.target.value)}
                placeholder="DD/MM/YYYY"
              />
            </Field>
            <Field label="Contact Number">
              <input
                className={inputCls}
                value={manual.contactNumber}
                onChange={(e) => updateManual("contactNumber", e.target.value)}
                placeholder="Phone number"
              />
            </Field>
            <Field label="Email Address">
              <input
                className={inputCls}
                value={manual.email}
                onChange={(e) => updateManual("email", e.target.value)}
                placeholder="Email"
              />
            </Field>
            <Field label="Permanent Address">
              <textarea
                className={inputCls + " min-h-[80px] resize-y"}
                value={manual.permanentAddress}
                onChange={(e) => updateManual("permanentAddress", e.target.value)}
                placeholder="Full residential address"
              />
            </Field>
            <Field label="PG Option">
              <Select
                value={manual.pgOption || undefined}
                onValueChange={(v) => updateManual("pgOption", v)}
              >
                <SelectTrigger
                  className={triggerCls + " h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}
                >
                  <SelectValue placeholder="Select PG…" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl">
                  {PG_LIST.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]"
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-xl text-gold">Parent / Guardian</h3>
            <Field label="Parent/Guardian Full Name">
              <input
                className={inputCls}
                value={manual.guardianName}
                onChange={(e) => updateManual("guardianName", e.target.value)}
                placeholder="Full Name"
              />
            </Field>
            <Field label="Relationship (S/o, D/o, W/o)">
              <input
                className={inputCls}
                value={manual.guardianRelation}
                onChange={(e) => updateManual("guardianRelation", e.target.value)}
                placeholder="S/o, D/o, W/o"
              />
            </Field>
            <Field label="Parent/Guardian Address">
              <textarea
                className={inputCls + " min-h-[80px] resize-y"}
                value={manual.guardianAddress}
                onChange={(e) => updateManual("guardianAddress", e.target.value)}
                placeholder="Full residential address"
              />
            </Field>
            <Field label="Parent/Guardian Contact">
              <input
                className={inputCls}
                value={manual.guardianPhone}
                onChange={(e) => updateManual("guardianPhone", e.target.value)}
                placeholder="Phone number"
              />
            </Field>
            <Field label="Parent/Guardian Email">
              <input
                className={inputCls}
                value={manual.guardianEmail}
                onChange={(e) => updateManual("guardianEmail", e.target.value)}
                placeholder="Email"
              />
            </Field>
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          disabled={mode === "sheet" ? !selected : !manualValid}
          onClick={onNext}
          className="btn-gold rounded-xl px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
