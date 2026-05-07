import { useEffect } from "react";
import { PG_ADDRESSES, PG_LIST, type AgreementData } from "@/lib/pg-data";

type Props = {
  data: AgreementData;
  setData: (d: AgreementData) => void;
  onBack: () => void;
  onNext: () => void;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-wider text-white/50 font-medium">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const inputCls = "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all";

export function DetailsStep({ data, setData, onBack, onNext }: Props) {
  // Auto-fill end date when start date or rent changes
  useEffect(() => {
    if (data.startDate && !data.endDate) {
      const d = new Date(data.startDate);
      d.setMonth(d.getMonth() + 11);
      setData({ ...data, endDate: d.toISOString().slice(0, 10) });
    }
  }, [data.startDate]);

  const update = <K extends keyof AgreementData>(k: K, v: AgreementData[K]) => setData({ ...data, [k]: v });

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">Agreement Details</h2>
        <p className="text-white/50 text-sm mt-1">Owner, PG and payment terms</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          <h3 className="font-display text-xl text-gold">Owner</h3>
          <Field label="Owner Name"><input className={inputCls} value={data.ownerName} onChange={e => update("ownerName", e.target.value)} /></Field>
          <Field label="Owner Contact"><input className={inputCls} value={data.ownerContact} onChange={e => update("ownerContact", e.target.value)} /></Field>
        </div>

        <div className="space-y-5">
          <h3 className="font-display text-xl text-gold">PG &amp; Payment</h3>

          <Field label="PG Name">
            <select className={inputCls} value={data.pgName}
              onChange={e => {
                const pg = e.target.value;
                setData({ ...data, pgName: pg, pgAddress: PG_ADDRESSES[pg] || "" });
              }}>
              <option value="" className="bg-[#1a1a1f]">Select PG…</option>
              {PG_LIST.map(p => <option key={p} value={p} className="bg-[#1a1a1f]">{p}</option>)}
            </select>
          </Field>

          <Field label="PG Address"><input className={inputCls} value={data.pgAddress} onChange={e => update("pgAddress", e.target.value)} /></Field>
          <Field label="Room Number"><input className={inputCls} value={data.roomNumber} onChange={e => update("roomNumber", e.target.value)} /></Field>

          <Field label="Monthly Rent (₹)">
            <input type="number" className={inputCls + " font-mono"} value={data.monthlyRent || ""}
              onChange={e => {
                const rent = Number(e.target.value);
                setData({ ...data, monthlyRent: rent, securityDeposit: rent * 3 });
              }} />
          </Field>

          <Field label="Payment Mode">
            <div className="grid grid-cols-1 gap-2">
              {(["Monthly", "Annual 1 Instalment", "Annual 2 Instalments"] as const).map(m => (
                <label key={m} className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition-all ${data.paymentMode === m ? "border-[#D4A853] bg-[#D4A853]/10" : "border-white/10 hover:border-white/20"}`}>
                  <input type="radio" className="accent-[#D4A853]" checked={data.paymentMode === m} onChange={() => update("paymentMode", m)} />
                  {m}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date"><input type="date" className={inputCls} value={data.startDate} onChange={e => update("startDate", e.target.value)} /></Field>
            <Field label="End Date"><input type="date" className={inputCls} value={data.endDate} onChange={e => update("endDate", e.target.value)} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Security Deposit (₹)"><input type="number" className={inputCls + " font-mono"} value={data.securityDeposit || ""} onChange={e => update("securityDeposit", Number(e.target.value))} /></Field>
            <Field label="Maintenance (₹)"><input type="number" className={inputCls + " font-mono"} value={data.maintenanceCharges || ""} onChange={e => update("maintenanceCharges", Number(e.target.value))} /></Field>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">← Back</button>
        <button onClick={onNext} disabled={!data.pgName || !data.monthlyRent || !data.startDate}
          className="btn-gold rounded-xl px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}
