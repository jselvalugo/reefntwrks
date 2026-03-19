import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Sign In",
    template: "%s | REEF NTWRKS",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          {/* Coral accent wave mark */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="#FF6B47" />
            <path
              d="M6 20 C9 14, 12 18, 16 12 C20 6, 23 14, 26 10"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M6 24 C9 18, 13 22, 16 17 C19 12, 23 18, 26 15"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span
            className="text-white font-bold text-xl tracking-tight"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            REEF NTWRKS
          </span>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-subtle)" }}>
          Performance Media Buying Platform
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "var(--color-navy-light)",
          border: "1px solid var(--color-navy-border)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.6)",
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs" style={{ color: "var(--color-text-subtle)" }}>
        © {new Date().getFullYear()} REEF NTWRKS. All rights reserved.
      </p>
    </div>
  );
}
