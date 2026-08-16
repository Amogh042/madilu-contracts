import { useEffect, useState } from "react";
import { fetchAgreements, type DbAgreement } from "@/lib/agreements-db";
import { PG_LIST, PG_ADDRESSES } from "@/lib/pg-data";

type Props = {
  managerId?: string;
  onSelect: (agreement: DbAgreement) => void;
  onBack: () => void;
  title: string;
};

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const inputCls =
  "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all";
const selectCls =
  "input-glow w-full bg-[#111114]/90 border border-[#D4A853]/30 rounded-xl px-4 py-2.5 text-sm text-[#F5D799] placeholder:text-white/30 transition-all hover:border-[#D4A853]/50 focus:border-[#D4A853]/70 focus:outline-none focus:ring-2 focus:ring-[#D4A853]/20";

const emptyManual = {
  student_name: "",
  student_phone: "",
  student_email: "",
  student_dob: "",
  student_address: "",
  guardian_name: "",
  guardian_phone: "",
  pg_name: PG_LIST[0] || "",
  room_number: "",
  monthly_rent: 0,
  security_deposit: 0,
  start_date: "",
  end_date: "",
  resident_age: "",
};

export function AgreementStudentPicker({ managerId, onSelect, onBack, title }: Props) {
  const [agreements, setAgreements] = useState<DbAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState({ ...emptyManual });

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
    ? agreements.filter(
        (a) =>
          a.student_name.toLowerCase().includes(search.toLowerCase()) ||
          (a.student_phone || "").toLowerCase().includes(search.toLowerCase()) ||
          a.pg_name.toLowerCase().includes(search.toLowerCase()) ||
          (a.room_number || "").toLowerCase().includes(search.toLowerCase()),
      )
    : agreements;

  const handleManualSubmit = () => {
    if (!form.student_name.trim() || !form.pg_name) return;
    const stub: DbAgreement = {
      id: `manual_${Date.now()}`,
      manager_id: managerId || null,
      student_name: form.student_name,
      student_phone: form.student_phone,
      student_email: form.student_email,
      student_dob: form.student_dob,
      student_address: form.student_address,
      guardian_name: form.guardian_name,
      guardian_phone: form.guardian_phone,
      guardian_email: "",
      guardian_address: "",
      pg_name: form.pg_name,
      pg_address: PG_ADDRESSES[form.pg_name] || "",
      room_number: form.room_number,
      monthly_rent: form.monthly_rent,
      payment_mode: "Monthly",
      start_date: form.start_date,
      end_date: form.end_date,
      security_deposit: form.security_deposit,
      maintenance_charges: 0,
      owner_name: null,
      owner_contact: null,
      owner_father_name: null,
      owner_age: null,
      owner_address: null,
      resident_age: form.resident_age || null,
      resident_college: null,
      resident_student_id: null,
      parent_father_name: null,
      parent_age: null,
      agreement_text_snapshot: null,
      status: "approved",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      approved_by: null,
      rejection_reason: null,
    };
    onSelect(stub);
  };

  if (manual) {
    return (
      <div className="glass rounded-3xl p-8 animate-fade-in">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold">{title}</h2>
          <p className="text-white/50 text-sm mt-1">Enter student details manually</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <input
            className={inputCls}
            placeholder="Student Name *"
            value={form.student_name}
            onChange={(e) => setForm({ ...form, student_name: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Phone"
            value={form.student_phone}
            onChange={(e) => setForm({ ...form, student_phone: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Email"
            value={form.student_email}
            onChange={(e) => setForm({ ...form, student_email: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Age"
            value={form.resident_age}
            onChange={(e) => setForm({ ...form, resident_age: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Guardian Name"
            value={form.guardian_name}
            onChange={(e) => setForm({ ...form, guardian_name: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Guardian Phone"
            value={form.guardian_phone}
            onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })}
          />
          <select
            className={selectCls}
            value={form.pg_name}
            onChange={(e) => setForm({ ...form, pg_name: e.target.value })}
          >
            {PG_LIST.map((p) => (
              <option key={p} value={p} className="bg-[#111114] text-[#F5D799]">
                {p}
              </option>
            ))}
          </select>
          <input
            className={inputCls}
            placeholder="Room Number"
            value={form.room_number}
            onChange={(e) => setForm({ ...form, room_number: e.target.value })}
          />
          <input
            className={inputCls}
            placeholder="Monthly Rent"
            type="number"
            value={form.monthly_rent || ""}
            onChange={(e) => setForm({ ...form, monthly_rent: Number(e.target.value) })}
          />
          <input
            className={inputCls}
            placeholder="Security Deposit"
            type="number"
            value={form.security_deposit || ""}
            onChange={(e) => setForm({ ...form, security_deposit: Number(e.target.value) })}
          />
          <div>
            <label className="text-xs text-white/40 mb-1 block">Start Date</label>
            <input
              className={inputCls}
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">End Date</label>
            <input
              className={inputCls}
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setManual(false)}
            className="glass glass-hover rounded-xl px-6 py-3 text-sm"
          >
            ← Back to List
          </button>
          <button
            onClick={handleManualSubmit}
            disabled={!form.student_name.trim()}
            className="rounded-xl px-6 py-3 text-sm font-medium bg-[#D4A853] text-[#1a1a2e] hover:bg-[#F5D799] disabled:opacity-40 transition"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        <p className="text-white/50 text-sm mt-1">
          Select a student from existing approved agreements
        </p>
      </div>

      <input
        className={inputCls + " mb-5"}
        placeholder="Search by name, phone, PG, or room..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-white/40 text-sm">
          {search ? "No matching students found." : "No approved agreements found."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="glass glass-hover rounded-xl p-4 text-left transition-all hover:border-[#D4A853]/40 border border-transparent"
            >
              <p className="font-medium truncate">{a.student_name}</p>
              <p className="text-xs text-white/50 mt-1">
                <span className="text-[#F5D799]">{a.pg_name}</span>
                {a.room_number && (
                  <>
                    <span className="mx-1 text-white/20">·</span>Room {a.room_number}
                  </>
                )}
              </p>
              <p className="text-xs text-white/40 mt-0.5 font-mono">
                {fmtDate(a.start_date)} → {fmtDate(a.end_date)}
              </p>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">
          ← Back
        </button>
        <button
          onClick={() => setManual(true)}
          className="glass glass-hover rounded-xl px-6 py-3 text-sm border border-[#D4A853]/30 text-[#F5D799]"
        >
          Enter Details Manually
        </button>
      </div>
    </div>
  );
}
