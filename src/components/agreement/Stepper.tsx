const steps = ["Select Student", "Agreement Details", "Preview & Download"];
export function Stepper({ current }: { current: number }) {
  return (
    <div className="glass rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-3">
        {steps.map((label, i) => {
          const active = i === current;
          const done = i < current;
          return (
            <div key={label} className="flex items-center gap-3 flex-1">
              <div className={`flex items-center gap-3 ${active || done ? "" : "opacity-40"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  active ? "btn-gold" : done ? "bg-[oklch(0.78_0.12_190)] text-black" : "border border-white/15 text-white/60"
                }`}>{done ? "✓" : i + 1}</div>
                <span className="text-sm font-medium hidden sm:inline whitespace-nowrap">{label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < current ? "bg-[oklch(0.78_0.12_190)]" : "bg-white/10"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
