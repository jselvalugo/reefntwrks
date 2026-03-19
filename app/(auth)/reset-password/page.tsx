"use client";

import { useState, useTransition, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "idle" | "success" | "error";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMsg(null);
    setStatus("idle");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setStatus("error");
      return;
    }

    if (form.password !== form.confirm) {
      setErrorMsg("Passwords do not match.");
      setStatus("error");
      return;
    }

    if (!token) {
      setErrorMsg("Invalid or missing reset token. Please request a new reset link.");
      setStatus("error");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/auth/reset-password/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password: form.password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setErrorMsg(
            data?.error ?? "Something went wrong. The link may have expired."
          );
          setStatus("error");
          return;
        }

        setStatus("success");
        setTimeout(() => router.push("/login"), 3000);
      } catch {
        setErrorMsg("Unable to reach the server. Please check your connection.");
        setStatus("error");
      }
    });
  }

  if (!token) {
    return (
      <div
        className="rounded-xl p-5 flex flex-col items-center text-center gap-3"
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(239,68,68,0.15)" }}
        >
          <svg className="w-6 h-6" fill="none" stroke="#EF4444" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-white">Invalid reset link</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-subtle)" }}>
            This link is invalid or has expired. Please request a new one.
          </p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-1 text-sm font-medium transition-colors duration-150 hover:opacity-80"
          style={{ color: "var(--color-coral)" }}
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (status === "success") {
    return (
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
          <p className="font-semibold text-white">Password updated</p>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-subtle)" }}>
            Your password has been reset successfully. Redirecting you to sign in…
          </p>
        </div>
        <Link
          href="/login"
          className="mt-1 text-sm font-medium transition-colors duration-150 hover:opacity-80"
          style={{ color: "var(--color-coral)" }}
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
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
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {errorMsg}
        </div>
      )}

      {/* New password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "#C9D1E0" }}
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={handleChange}
          disabled={isPending}
          placeholder="At least 8 characters"
          className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 transition-colors duration-150 outline-none disabled:opacity-50"
          style={{
            background: "var(--color-navy)",
            border: "1px solid var(--color-navy-border)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-navy-border)")}
        />
        {/* Password strength hint */}
        {form.password.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            {[1, 2, 3, 4].map((level) => {
              const strength = Math.min(
                Math.floor(
                  (form.password.length >= 8 ? 1 : 0) +
                  (/[A-Z]/.test(form.password) ? 1 : 0) +
                  (/[0-9]/.test(form.password) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0)
                ),
                4
              );
              const colors = ["#EF4444", "#F59E0B", "#3B82F6", "#22C55E"];
              return (
                <div
                  key={level}
                  className="h-1 flex-1 rounded-full transition-all duration-300"
                  style={{
                    background: level <= strength ? colors[strength - 1] : "var(--color-navy-border)",
                  }}
                />
              );
            })}
            <span className="text-xs ml-1" style={{ color: "var(--color-text-subtle)" }}>
              {(() => {
                const strength =
                  (form.password.length >= 8 ? 1 : 0) +
                  (/[A-Z]/.test(form.password) ? 1 : 0) +
                  (/[0-9]/.test(form.password) ? 1 : 0) +
                  (/[^A-Za-z0-9]/.test(form.password) ? 1 : 0);
                return ["Weak", "Fair", "Good", "Strong"][strength - 1] ?? "Weak";
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label
          htmlFor="confirm"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "#C9D1E0" }}
        >
          Confirm new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={form.confirm}
          onChange={handleChange}
          disabled={isPending}
          placeholder="Repeat your password"
          className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 transition-colors duration-150 outline-none disabled:opacity-50"
          style={{
            background: "var(--color-navy)",
            border:
              form.confirm && form.confirm !== form.password
                ? "1px solid rgba(239,68,68,0.6)"
                : "1px solid var(--color-navy-border)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
          onBlur={(e) => {
            e.currentTarget.style.borderColor =
              form.confirm && form.confirm !== form.password
                ? "rgba(239,68,68,0.6)"
                : "var(--color-navy-border)";
          }}
        />
        {form.confirm && form.confirm !== form.password && (
          <p className="mt-1 text-xs" style={{ color: "#FCA5A5" }}>
            Passwords do not match
          </p>
        )}
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
          e.currentTarget.style.background = "var(--color-coral)";
        }}
      >
        {isPending && <Spinner />}
        {isPending ? "Updating password…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-subtle)" }}>
          Choose a strong password for your account.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
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
