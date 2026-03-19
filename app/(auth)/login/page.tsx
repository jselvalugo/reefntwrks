"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: form.email,
          password: form.password,
          redirect: false,
        });

        if (result?.error) {
          if (result.error.includes("Too many")) {
            setError("Too many failed attempts. Please wait 15 minutes.");
          } else {
            setError("Invalid email or password. Please try again.");
          }
          return;
        }

        // Fetch session to determine role-based redirect
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/portal/dashboard");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  async function handleGoogleSignIn() {
    setIsGooglePending(true);
    try {
      await signIn("google", { callbackUrl: "/portal/dashboard" });
    } catch {
      setError("Failed to sign in with Google.");
      setIsGooglePending(false);
    }
  }

  const isLoading = isPending || isGooglePending;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-subtle)" }}>
          Sign in to your REEF NTWRKS account
        </p>
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "var(--color-navy)",
          border: "1px solid var(--color-navy-border)",
          color: "white",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) (e.currentTarget.style.borderColor = "var(--color-coral)");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.style.borderColor = "var(--color-navy-border)");
        }}
      >
        {isGooglePending ? (
          <Spinner className="w-4 h-4" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--color-navy-border)" }} />
        <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          or sign in with email
        </span>
        <div className="flex-1 h-px" style={{ background: "var(--color-navy-border)" }} />
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2"
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
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
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
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium"
              style={{ color: "#C9D1E0" }}
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs transition-colors duration-150 hover:text-white"
              style={{ color: "var(--color-coral)" }}
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="••••••••"
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
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "var(--color-coral)" }}
          onMouseEnter={(e) => {
            if (!isLoading) (e.currentTarget.style.background = "var(--color-coral-hover)");
          }}
          onMouseLeave={(e) => {
            (e.currentTarget.style.background = "var(--color-coral)");
          }}
        >
          {isPending ? <Spinner className="w-4 h-4" /> : null}
          {isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? "w-4 h-4"}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
