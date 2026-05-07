import { useEffect, useMemo, useState } from "react";
import { fetchStudents } from "@/lib/fetch-students";
import type { Student } from "@/lib/pg-data";

type Props = {
  selected: Student | null;
  onSelect: (s: Student) => void;
  onNext: () => void;
};

export function StudentStep({ selected, onSelect, onNext }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.phone.includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.pg.toLowerCase().includes(term)
    );
  }, [q, students]);

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl font-bold">Select Student</h2>
          <p className="text-white/50 text-sm mt-1">Choose from records synced via Google Sheets</p>
        </div>
        <button onClick={load} disabled={loading} className="glass glass-hover rounded-xl px-4 py-2 text-sm font-medium">
          {loading ? "Refreshing…" : "↻ Refresh List"}
        </button>
      </div>

      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, phone, email, PG…"
        className="input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 mb-6"
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4 text-sm mb-4">
          {error} — using empty list. Add a student manually in Step 2 still works once you pick one here, or paste your published CSV URL into <code className="font-mono text-xs">src/lib/pg-data.ts</code>.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass rounded-xl p-4 h-24 animate-pulse" />
        ))}
        {!loading && filtered.length === 0 && !error && (
          <div className="col-span-full text-center text-white/40 py-12 text-sm">No students found.</div>
        )}
        {filtered.map((s, i) => {
          const isSel = selected?.name === s.name && selected?.phone === s.phone;
          return (
            <button key={i} onClick={() => onSelect(s)}
              className={`glass glass-hover rounded-xl p-4 text-left transition-all ${isSel ? "ring-2 ring-[#D4A853]" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold truncate">{s.name}</p>
                  <p className="text-xs text-white/60 mt-0.5 font-mono">{s.phone}</p>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{s.email}</p>
                </div>
                {s.pg && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-[#D4A853]/15 text-[#F5D799] whitespace-nowrap">{s.pg}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <button disabled={!selected} onClick={onNext}
          className="btn-gold rounded-xl px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}
