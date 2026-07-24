import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Background } from "@/components/agreement/Background";
import { checkManagerPhone, setManagerPassword, verifyManagerPassword, getManagerByPhone } from "@/lib/managers-db";
import { setManagerSession } from "@/lib/auth";

export const Route = createFileRoute("/manager/login")({
  component: ManagerLogin,
});

const inputCls = "input-glow w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm placeholder:text-white/30 transition-all";

function ManagerLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [stage, setStage] = useState<"phone" | "set_password" | "enter_password">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await checkManagerPhone(phone.trim());
      if (result === "not_found") {
        setError("Phone number not registered. Contact the owner to be added as a manager.");
      } else if (result === "new" || result === "needs_password") {
        setStage("set_password");
      } else {
        setStage("enter_password");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPw) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const ok = await setManagerPassword(phone.trim(), password);
      if (!ok) { setError("Failed to set password"); return; }
      const manager = await getManagerByPhone(phone.trim());
      if (!manager) { setError("Manager not found"); return; }
      setManagerSession(manager);
      navigate({ to: "/manager/dashboard" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) return;
    setLoading(true);
    setError("");
    try {
      const ok = await verifyManagerPassword(phone.trim(), password);
      if (!ok) { setError("Incorrect password"); setLoading(false); return; }
      const manager = await getManagerByPhone(phone.trim());
      if (!manager) { setError("Manager account not found or deactivated"); setLoading(false); return; }
      setManagerSession(manager);
      navigate({ to: "/manager/dashboard" });
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
          <div className="w-14 h-14 rounded-2xl bg-[#4ECDC4]/15 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-[#4ECDC4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-bold mb-1">Manager Login</h2>
          <p className="text-white/50 text-sm mb-6">Sign in with your registered phone number.</p>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-3 text-sm mb-4">{error}</div>
          )}

          {stage === "phone" && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Phone Number</span>
                <input
                  className={inputCls + " mt-1.5"}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
                  placeholder="10-digit phone number"
                  type="tel"
                />
              </label>
              <button onClick={handlePhoneSubmit} disabled={loading || !phone.trim()} className="btn-gold rounded-xl px-6 py-3 text-sm w-full disabled:opacity-40">
                {loading ? "Checking..." : "Continue"}
              </button>
            </div>
          )}

          {stage === "set_password" && (
            <div className="space-y-4">
              <p className="text-[#4ECDC4] text-sm">First time login — set your password.</p>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">New Password</span>
                <input className={inputCls + " mt-1.5"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" type="password" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Confirm Password</span>
                <input className={inputCls + " mt-1.5"} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSetPassword()} placeholder="Repeat password" type="password" />
              </label>
              <button onClick={handleSetPassword} disabled={loading} className="btn-gold rounded-xl px-6 py-3 text-sm w-full disabled:opacity-40">
                {loading ? "Setting..." : "Set Password & Login"}
              </button>
            </div>
          )}

          {stage === "enter_password" && (
            <div className="space-y-4">
              <p className="text-white/50 text-sm">Phone: <span className="text-white font-mono">{phone}</span></p>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-white/50 font-medium">Password</span>
                <input className={inputCls + " mt-1.5"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} placeholder="Enter your password" type="password" />
              </label>
              <button onClick={handleLogin} disabled={loading || !password} className="btn-gold rounded-xl px-6 py-3 text-sm w-full disabled:opacity-40">
                {loading ? "Signing in..." : "Sign In"}
              </button>
              <button onClick={() => { setStage("phone"); setPassword(""); setError(""); }} className="text-xs text-white/40 hover:text-white/60 w-full text-center">
                Use a different number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
