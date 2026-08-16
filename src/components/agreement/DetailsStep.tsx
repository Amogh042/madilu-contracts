import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  PG_ADDRESSES,
  PG_LIST,
  OWNER_LIST,
  type AgreementData,
  type Instalment,
} from "@/lib/pg-data";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

type Props = {
  data: AgreementData;
  setData: (d: AgreementData | null) => void;
  onBack: () => void;
  onNext: () => void;
  lockedPg?: string;
  allowedPgs?: string[];
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-wider text-white/50 font-medium">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const inputCls =
  "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 transition-all";
const triggerCls =
  "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition-all hover:border-[#D4A853]/40 data-[state=open]:border-[#D4A853]/60 data-[placeholder]:text-white/40";

const parseDateLocal = (v: string): Date | undefined => {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const DateField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const date = parseDateLocal(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={triggerCls}>
        <span className={value ? "" : "text-white/40"}>
          {date ? format(date, "dd MMM yyyy") : "Pick a date"}
        </span>
        <CalendarIcon className="h-4 w-4 text-[#D4A853]/80" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 border-white/10 bg-[#15151b]/95 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${day}`);
              setOpen(false);
            }
          }}
          captionLayout="dropdown"
          fromYear={2024}
          toYear={2030}
          className="bg-transparent text-white"
        />
      </PopoverContent>
    </Popover>
  );
};

const calcMonthsBetween = (startIso: string, endIso: string): number => {
  if (!startIso || !endIso) return 12;
  const [sy, sm, sd] = startIso.split("-").map(Number);
  const [ey, em, ed] = endIso.split("-").map(Number);
  const s = new Date(sy, sm - 1, sd, 12, 0, 0);
  const e = new Date(ey, em - 1, ed, 12, 0, 0);
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() >= s.getDate()) months += 1;
  return months || 12;
};

export function DetailsStep({ data, setData, onBack, onNext, lockedPg, allowedPgs }: Props) {
  const effectiveLockedPg = lockedPg || (allowedPgs?.length === 1 ? allowedPgs[0] : undefined);
  const pgOptions = allowedPgs && allowedPgs.length > 1 ? allowedPgs : PG_LIST;
  const [totalManual, setTotalManual] = useState(false);
  const calculateEndDate = (startDate: string): string => {
    const start = new Date(startDate + "T12:00:00");
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);
    const y = end.getFullYear();
    const m = String(end.getMonth() + 1).padStart(2, "0");
    const day = String(end.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    if (data.startDate) {
      setData({ ...data, endDate: calculateEndDate(data.startDate) });
    }
  }, [data.startDate]);

  useEffect(() => {
    if (totalManual) return;
    const months = calcMonthsBetween(data.startDate, data.endDate);
    const auto = Math.round(data.monthlyRent * months);
    if (auto !== (data.totalAmount || 0)) {
      setData({ ...data, totalAmount: auto });
    }
  }, [data.monthlyRent, data.startDate, data.endDate, totalManual]);

  const update = <K extends keyof AgreementData>(k: K, v: AgreementData[K]) =>
    setData({ ...data, [k]: v });

  const isMonthly = data.paymentMode === "Monthly";
  const instalmentCount = data.instalments?.length || 0;

  const hasPaymentAmount = data.monthlyRent > 0;

  const updateInstalment = (idx: number, field: keyof Instalment, value: number | string) => {
    const arr = [...(data.instalments || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setData({ ...data, instalments: arr });
  };

  const setInstalmentCount = (count: number) => {
    const arr: Instalment[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(data.instalments?.[i] || { amount: 0, dueDate: "" });
    }
    setData({ ...data, instalments: arr });
  };

  return (
    <div className="glass rounded-3xl p-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold">Agreement Details</h2>
        <p className="text-white/50 text-sm mt-1">Owner, resident, PG and payment terms</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column — Owner + Resident extra fields */}
        <div className="space-y-5">
          <h3 className="font-display text-xl text-gold">Owner (First Party)</h3>
          <Field label="Proprietor Name">
            <Select
              value={
                OWNER_LIST.some((o) => o.name === data.ownerName)
                  ? data.ownerName
                  : data.ownerName
                    ? "__other__"
                    : undefined
              }
              onValueChange={(v) => {
                if (v === "__other__") {
                  setData({
                    ...data,
                    ownerName: "",
                    ownerFatherName: "",
                    ownerContact: "",
                    ownerAge: "",
                    ownerAddress: "",
                  });
                } else {
                  const owner = OWNER_LIST.find((o) => o.name === v);
                  if (owner) {
                    setData({
                      ...data,
                      ownerName: owner.name,
                      ownerFatherName: owner.fatherName,
                      ownerContact: owner.contact,
                      ownerAge: owner.age,
                      ownerAddress: data.pgAddress,
                    });
                  }
                }
              }}
            >
              <SelectTrigger
                className={triggerCls + " h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}
              >
                <SelectValue placeholder="Select Owner…" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl">
                {OWNER_LIST.map((o) => (
                  <SelectItem
                    key={o.name}
                    value={o.name}
                    className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]"
                  >
                    {o.name}
                  </SelectItem>
                ))}
                <SelectItem
                  value="__other__"
                  className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799] text-white/50"
                >
                  Other (enter manually)
                </SelectItem>
              </SelectContent>
            </Select>
            {data.ownerName && !OWNER_LIST.some((o) => o.name === data.ownerName) && (
              <input
                className={inputCls + " mt-2"}
                value={data.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
                placeholder="Enter owner name"
              />
            )}
          </Field>
          <Field label="S/o (Father's Name)">
            <input
              className={inputCls}
              value={data.ownerFatherName}
              onChange={(e) => update("ownerFatherName", e.target.value)}
              placeholder="Father's name"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age">
              <input
                className={inputCls}
                value={data.ownerAge}
                onChange={(e) => update("ownerAge", e.target.value)}
                placeholder="Age"
              />
            </Field>
            <Field label="Contact">
              <input
                className={inputCls}
                value={data.ownerContact}
                onChange={(e) => update("ownerContact", e.target.value)}
                placeholder="Phone"
              />
            </Field>
          </div>

          <h3 className="font-display text-xl text-gold pt-3">Resident (Second Party)</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Resident Age">
              <input
                className={inputCls}
                value={data.residentAge}
                onChange={(e) => update("residentAge", e.target.value)}
                placeholder="Age"
              />
            </Field>
            <Field label="ID">
              <input
                className={inputCls}
                value={data.residentStudentId}
                onChange={(e) => update("residentStudentId", e.target.value)}
                placeholder="ID number"
              />
            </Field>
          </div>
          <Field label="College Name / Working At">
            <input
              className={inputCls}
              value={data.residentCollege}
              onChange={(e) => update("residentCollege", e.target.value)}
              placeholder="College / Workplace"
            />
          </Field>
          <Field label="Aadhaar Number">
            <input
              className={inputCls}
              value={data.residentAadhaar}
              onChange={(e) => update("residentAadhaar", e.target.value)}
              placeholder="Aadhaar number"
            />
          </Field>

          <h3 className="font-display text-xl text-gold pt-3">Parent / Guarantor (Third Party)</h3>
          <Field label="S/o / D/o (Father's Name)">
            <input
              className={inputCls}
              value={data.parentFatherName}
              onChange={(e) => update("parentFatherName", e.target.value)}
              placeholder="Father's name"
            />
          </Field>
          <Field label="Parent Age">
            <input
              className={inputCls}
              value={data.parentAge}
              onChange={(e) => update("parentAge", e.target.value)}
              placeholder="Age"
            />
          </Field>
        </div>

        {/* Right column — PG & Payment */}
        <div className="space-y-5">
          <h3 className="font-display text-xl text-gold">PG &amp; Payment</h3>

          <Field label="PG Name">
            {effectiveLockedPg ? (
              <div className={inputCls + " opacity-70 cursor-not-allowed"}>{effectiveLockedPg}</div>
            ) : (
              <Select
                value={data.pgName || undefined}
                onValueChange={(pg) =>
                  setData({
                    ...data,
                    pgName: pg,
                    pgAddress: PG_ADDRESSES[pg] || "",
                    ownerAddress: PG_ADDRESSES[pg] || "",
                  })
                }
              >
                <SelectTrigger
                  className={triggerCls + " h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}
                >
                  <SelectValue placeholder="Select PG…" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl">
                  {pgOptions.map((p) => (
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
            )}
          </Field>

          <Field label="PG Address">
            <input
              className={inputCls}
              value={data.pgAddress}
              onChange={(e) => update("pgAddress", e.target.value)}
              placeholder="Full address"
            />
          </Field>
          <Field label="Room Number">
            <input
              className={inputCls}
              value={data.roomNumber}
              onChange={(e) => update("roomNumber", e.target.value)}
              placeholder="Room no."
            />
          </Field>

          <Field label="Monthly Rent (₹)">
            <input
              type="number"
              step="1"
              className={inputCls + " font-mono"}
              value={data.monthlyRent || ""}
              onChange={(e) => {
                const rent = Math.round(Number(e.target.value));
                setData({ ...data, monthlyRent: rent, securityDeposit: rent * 3 });
              }}
              placeholder="0"
            />
          </Field>

          {/* Payment Mode */}
          <Field label="Payment Mode">
            <div className="grid grid-cols-2 gap-2">
              {(["Monthly", "Instalments"] as const).map((m) => (
                <label
                  key={m}
                  className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition-all ${data.paymentMode === m ? "border-[#D4A853] bg-[#D4A853]/10" : "border-white/10 hover:border-white/20"}`}
                >
                  <input
                    type="radio"
                    className="accent-[#D4A853]"
                    checked={data.paymentMode === m}
                    onChange={() => {
                      setData({
                        ...data,
                        paymentMode: m,
                        instalments:
                          m === "Instalments"
                            ? data.instalments?.length
                              ? data.instalments
                              : []
                            : undefined,
                      });
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
          </Field>

          {!isMonthly && (
            <div className="space-y-4">
              <Field label="Number of Instalments">
                <Select
                  value={instalmentCount > 0 ? String(instalmentCount) : undefined}
                  onValueChange={(v) => setInstalmentCount(Number(v))}
                >
                  <SelectTrigger
                    className={triggerCls + " h-auto [&>svg]:text-[#D4A853] [&>svg]:opacity-100"}
                  >
                    <SelectValue placeholder="Select count…" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#15151b]/95 backdrop-blur-2xl text-white shadow-2xl rounded-2xl max-h-[300px]">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem
                        key={n}
                        value={String(n)}
                        className="rounded-lg my-0.5 focus:bg-[#D4A853]/15 focus:text-[#F5D799] data-[state=checked]:text-[#F5D799]"
                      >
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {data.instalments?.map((inst, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-3">
                  <Field label={`Instalment ${idx + 1} Amount (₹)`}>
                    <input
                      type="number"
                      className={inputCls + " font-mono"}
                      value={inst.amount || ""}
                      onChange={(e) =>
                        updateInstalment(idx, "amount", Math.round(Number(e.target.value)))
                      }
                      placeholder="0"
                    />
                  </Field>
                  <Field label="Due Date">
                    <DateField
                      value={inst.dueDate}
                      onChange={(v) => updateInstalment(idx, "dueDate", v)}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <DateField value={data.startDate} onChange={(v) => update("startDate", v)} />
            </Field>
            <Field label="End Date">
              <DateField value={data.endDate} onChange={(v) => update("endDate", v)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Security Deposit (₹)">
              <input
                type="number"
                step="1"
                className={inputCls + " font-mono"}
                value={data.securityDeposit || ""}
                onChange={(e) => update("securityDeposit", Math.round(Number(e.target.value)))}
                placeholder="0"
              />
            </Field>
            <Field label="AMC / Maintenance (₹)">
              <input
                type="number"
                step="1"
                className={inputCls + " font-mono"}
                value={data.maintenanceCharges || ""}
                onChange={(e) => update("maintenanceCharges", Math.round(Number(e.target.value)))}
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Total Amount (₹)">
            <input
              type="number"
              step="1"
              className={inputCls + " font-mono"}
              value={data.totalAmount || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || v === "0") {
                  setTotalManual(false);
                  update("totalAmount", 0);
                } else {
                  setTotalManual(true);
                  update("totalAmount", Math.round(Number(v)));
                }
              }}
              placeholder="Auto-calculated"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button onClick={onBack} className="glass glass-hover rounded-xl px-6 py-3 text-sm">
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!data.pgName || !hasPaymentAmount || !data.startDate}
          className="btn-gold rounded-xl px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
