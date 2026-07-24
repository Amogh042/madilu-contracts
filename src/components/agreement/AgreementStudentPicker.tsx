import { useEffect, useState } from "react";
import { fetchAgreements, type DbAgreement } from "@/lib/agreements-db";

type Props = {
  managerId?: string;
  onSelect: (agreement: DbAgreement) => void;
  onBack: () => void;
  title: string;
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export function AgreementStudentPicker({ managerId, onSelect, onBack, title }: Props) {
  const [agreements, setAgreements] = useState<DbAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const filters: { status?: string; manager_id?: string } = { status: "approved" };
        if (managerId) filters.manager_id = managerId;
        const all = await fetchAgreements(filters);
        const seen = new Map<string, DbAgreement>();
        for (const a of all) {
          const key = `${a.student_name}_${a.student_phone}`;
          if (!seen.has(key) || new Date(a.created_at) > new Date(seen.get(key)!.created_at)) {
            seen.set(key, a);
          }
        }
        setAgreements(Array.from(seen.values()));
      } catch (e) {
        console.error("Failed to load agreements:", e);
      }
      setLoading(false);
    })();
  }, [managerId]);

  const filtered = search.trim()
    ? agreements.filter(a =>
        a.student_name.toLowerCase().includes(search.toLowerCase()) ||
        a.pg_name.toLowerCase().includes(search.toLowerCase()) ||
        (a.room_number || "").toLowerCase().includes(search.toLowerCase())
      )
    : agreements;

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        <p className="text-white/50 text-sm mt-1">Select a student from existing approved agreements</p>
      </div>

      <input
        className="input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all mb-5"
        placeholder="Search by name, PG, or room..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-xl p-4 h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-white/40 text-sm">
          {search ? "No matching students found." : "No approved agreements found."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map(a => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="glass glass-hover rounded-xl p-4 text-left transition-all hover:border-[#D4A853]/40 border border-transparent"
            >
              <p className="font-medium truncate">{a.student_name}</p>
              <p className="text-xs text-white/50 mt-1">
                <span className="text-[#F5D799]">{a.pg_name}</span>
                {a.room_number && <><span className="mx-1 text-white/20">·</span>Room {a.room_number}</>}
              </p>
              <p className="text-xs text-white/40 mt-0.5 font-mono">
                {fmtDate(a.start_date)} → {fmtDate(a.end_date)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-start mt-6">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">← Back</button>
      </div>
    </div>
  );
}
