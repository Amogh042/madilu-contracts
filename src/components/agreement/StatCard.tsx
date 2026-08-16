type Props = { label: string; value: string | number; hint?: string };
export function StatCard({ label, value, hint }: Props) {
  return (
    <div className="glass glass-hover rounded-2xl p-6 relative overflow-hidden">
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #D4A853, transparent 70%)" }}
      />
      <p className="text-xs uppercase tracking-[0.2em] text-white/50 font-medium">{label}</p>
      <p className="font-display text-5xl mt-3 text-gold font-bold">{value}</p>
      {hint && <p className="text-xs text-white/40 mt-2 font-mono">{hint}</p>}
    </div>
  );
}
