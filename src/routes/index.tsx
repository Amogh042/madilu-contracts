import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Background } from "@/components/agreement/Background";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <Background />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-gold leading-tight">
            Madilu PG
          </h1>
          <p className="text-white/50 text-lg mt-3 tracking-wide">Agreement Management System</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <button
            onClick={() => navigate({ to: "/manager/login" })}
            className="glass glass-hover rounded-3xl p-10 text-left group relative overflow-hidden"
          >
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #4ECDC4, transparent 70%)" }}
            />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#4ECDC4]/15 flex items-center justify-center mb-5">
                <svg
                  className="w-7 h-7 text-[#4ECDC4]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Manager Portal</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Create and manage agreements for your assigned PG property.
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate({ to: "/owner/login" })}
            className="glass glass-hover rounded-3xl p-10 text-left group relative overflow-hidden"
          >
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #D4A853, transparent 70%)" }}
            />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-[#D4A853]/15 flex items-center justify-center mb-5">
                <svg
                  className="w-7 h-7 text-[#D4A853]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Owner Portal</h2>
              <p className="text-white/50 text-sm leading-relaxed">
                Approve agreements, manage PG managers, and oversee operations.
              </p>
            </div>
          </button>
        </div>

        <footer className="text-center text-white/30 text-xs mt-12 font-mono">
          Madilu PG · Bangalore · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
