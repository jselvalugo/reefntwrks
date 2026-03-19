"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

type Status = "idle" | "success" | "error";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(data?.error ?? "Something went wrong. Please try again.");
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        setErrorMsg("Unable to reach the server. Please check your connection.");
        setStatus("error");
      }
    });
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors duration-150 hover:text-white"
          style={{ color: "var(--color-text-subtle)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-subtle)" }}>
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {status === "success" ? (
        <div
          className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.25)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.15)" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="#22C55E" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white">Check your inbox</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-subtle)" }}>
              If an account exists for <span className="text-white font-medium">{email}</span>,
              you&apos;ll receive a reset link shortly.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-1 text-sm font-medium transition-colors duration-150 hover:opacity-80"
            style={{ color: "var(--color-coral)" }}
          >
            Return to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {status === "error" && errorMsg && (
            <div
              className="px-4 py-3 rounded-lg text-sm flex items-start gap-2"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#FCA5A5",
              }}
              role="alert"
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errorMsg}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#C9D1E0" }}
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              disabled={isPending}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 transition-colors duration-150 outline-none disabled:opacity-50"
              style={{
                background: "var(--color-navy)",
                border: "1px solid var(--color-navy-border)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-navy-border)")}
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "var(--color-coral)" }}
            onMouseEnter={(e) => {
              if (!isPending) (e.currentTarget.style.background = "var(--color-coral-hover)");
            }}
            onMouseLeave={(e) => {
              (e.currentTarget.style.background = "var(--color-coral)");
            }}
          >
            {isPending && <Spinner />}
            {isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
