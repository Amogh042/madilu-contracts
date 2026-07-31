import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Background } from "@/components/agreement/Background";
import { ownerSignIn } from "@/lib/auth";

export const Route = createFileRoute("/owner/login")({
  component: OwnerLogin,
});

const inputCls = "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 transition-all";

function OwnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await ownerSignIn(email, password);
      navigate({ to: "/owner/dashboard" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Background />
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <button onClick={() => navigate({ to: "/" })} className="glass glass-hover rounded-xl px-4 py-2 text-sm mb-8 inline-block">
          ← Back
        </button>

        <div className="glass rounded-3xl p-8 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-[#D4A853]/15 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-[#D4A853]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold mb-1">Owner Login</h2>
          <p className="text-white/50 text-sm mb-6">Sign in with your admin email and password.</p>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm mb-4">{error}</div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Email</span>
              <input className={inputCls + " mt-1.5"} value={email} onChange={e => setEmail(e.target.value)} placeholder="madilu@admin.com" type="email" />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Password</span>
              <div className="relative">
                <input
                  className={inputCls + " pr-10 mt-1.5"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                  placeholder="Password"
                  type={showPw ? "text" : "password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-[3px] text-white/40 hover:text-white/70 transition"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <button onClick={handleLogin} disabled={loading || !email || !password} className="btn-gold rounded-xl px-6 py-3 text-sm w-full disabled:opacity-40">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
