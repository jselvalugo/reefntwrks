"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  storeUrl: string;
  platform: string;
  monthlySpend: string;
  goal: string;
  priorAgency: string;
  source: string;
}

interface FieldError {
  [key: string]: string;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): FieldError {
  const errors: FieldError = {};
  if (step === 1) {
    if (!data.name.trim()) errors.name = "Name is required.";
    if (!data.email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  }
  if (step === 2) {
    if (!data.storeUrl.trim()) errors.storeUrl = "Store URL is required.";
    else if (!/^https?:\/\/.+\..+/.test(data.storeUrl)) errors.storeUrl = "Enter a valid URL (e.g. https://yourstore.com)";
  }
  if (step === 3 && !data.platform) errors.platform = "Please select a platform.";
  if (step === 4 && !data.monthlySpend) errors.monthlySpend = "Please select your monthly ad spend.";
  if (step === 5 && !data.goal) errors.goal = "Please select your primary goal.";
  if (step === 6 && !data.priorAgency) errors.priorAgency = "Please answer this question.";
  return errors;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-subtle)" }}>
          Step {current} of {total}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--color-coral)" }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--color-navy-border)" }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--color-coral)" }}
        />
      </div>
    </div>
  );
}

function FieldWrapper({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}

function TextInput({
  value, onChange, onBlur, placeholder, type = "text", error,
}: { value: string; onChange: (v: string) => void; onBlur?: () => void; placeholder?: string; type?: string; error?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
      style={{
        background: "var(--color-navy-light)",
        border: `1px solid ${error ? "var(--color-danger)" : "var(--color-navy-border)"}`,
      }}
    />
  );
}

function RadioCard({
  value, selected, onChange, label, sublabel,
}: { value: string; selected: boolean; onChange: (v: string) => void; label: string; sublabel?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all"
      style={{
        background: selected ? "var(--color-coral-muted)" : "var(--color-navy-light)",
        border: `1px solid ${selected ? "var(--color-coral)" : "var(--color-navy-border)"}`,
      }}
    >
      <div
        className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all"
        style={{
          borderColor: selected ? "var(--color-coral)" : "var(--color-navy-border)",
          background: selected ? "var(--color-coral)" : "transparent",
        }}
      >
        {selected && (
          <svg className="w-2.5 h-2.5" fill="white" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="2" />
          </svg>
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--color-text-subtle)" }}>{sublabel}</div>}
      </div>
    </button>
  );
}

function NavButtons({
  step, onBack, onNext, onSubmit, loading,
}: { step: number; onBack: () => void; onNext: () => void; onSubmit: () => void; loading: boolean }) {
  const isLast = step === TOTAL_STEPS - 1; // step 7 is last question, step 8 is confirmation
  return (
    <div className="flex gap-3 mt-8">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-medium transition-all border"
          style={{ borderColor: "var(--color-navy-border)", color: "var(--color-text-subtle)" }}
        >
          Back
        </button>
      )}
      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ background: "var(--color-coral)" }}
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "var(--color-coral)" }}
        >
          Continue
        </button>
      )}
    </div>
  );
}

// ── Confirmation screen ───────────────────────────────────────────────────────

function Confirmation({ data }: { data: FormData }) {
  const summary = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    { label: "Store URL", value: data.storeUrl },
    { label: "Platform", value: data.platform },
    { label: "Monthly Ad Spend", value: data.monthlySpend },
    { label: "Primary Goal", value: data.goal },
    { label: "Prior Agency Experience", value: data.priorAgency === "yes" ? "Yes" : "No" },
    { label: "How You Found Us", value: data.source || "—" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ background: "var(--color-coral-muted)" }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-coral)" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">We'll see you soon!</h2>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-subtle)" }}>
        Your information has been received. A member of our team will reach out within one business day to schedule your free audit.
      </p>

      {/* Calendar placeholder */}
      <div
        className="rounded-2xl p-6 mb-8 text-left"
        style={{ background: "var(--color-navy-light)", border: "1px solid var(--color-navy-border)" }}
      >
        <p className="text-sm font-semibold text-white mb-3">Schedule Your Audit Call</p>
        <div
          className="rounded-xl flex items-center justify-center h-48"
          style={{ background: "var(--color-navy)", border: "1px solid var(--color-navy-border)" }}
        >
          {/* Calendly iframe would go here */}
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-subtle)" }}>Calendly calendar will appear here</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>
              Replace with: &lt;iframe src=&quot;https://calendly.com/your-link&quot; /&gt;
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div
        className="rounded-2xl p-6 text-left"
        style={{ background: "var(--color-navy-light)", border: "1px solid var(--color-navy-border)" }}
      >
        <p className="text-sm font-semibold text-white mb-4">Your Submission Summary</p>
        <dl className="space-y-3">
          {summary.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-xs font-medium flex-shrink-0" style={{ color: "var(--color-text-subtle)" }}>{label}</dt>
              <dd className="text-xs text-white text-right break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-sm transition-colors"
        style={{ color: "var(--color-text-subtle)" }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to homepage
      </Link>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function IntakePage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});

  const [data, setData] = useState<FormData>({
    name: "",
    email: "",
    storeUrl: "",
    platform: "",
    monthlySpend: "",
    goal: "",
    priorAgency: "",
    source: "",
  });

  const set = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }, []);

  const validateAndAdvance = () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          storeUrl: data.storeUrl,
          platform: data.platform,
          monthlySpend: data.monthlySpend,
          goal: data.goal,
          priorAgency: data.priorAgency === "yes",
          source: data.source,
        }),
      });
    } catch {
      // Proceed to confirmation regardless
    } finally {
      setLoading(false);
      setSubmitted(true);
      setStep(TOTAL_STEPS);
    }
  };

  const stepTitle: Record<number, string> = {
    1: "Let's get started",
    2: "Your store",
    3: "Your platform",
    4: "Your ad spend",
    5: "Your primary goal",
    6: "Agency experience",
    7: "One last thing",
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-navy)" }}>
      {/* Navbar */}
      <header style={{ borderBottom: "1px solid var(--color-navy-border)" }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-coral)" }}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M4 20 C7 14, 10 18, 14 12 C18 6, 21 14, 24 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M4 24 C7 18, 11 22, 14 17 C17 12, 21 18, 24 15" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="text-white font-bold text-base tracking-tight">REEF NTWRKS</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {submitted ? (
          <Confirmation data={data} />
        ) : (
          <div className="w-full max-w-lg">
            <ProgressBar current={step} total={TOTAL_STEPS} />

            <div
              className="rounded-2xl p-8"
              style={{ background: "var(--color-navy-light)", border: "1px solid var(--color-navy-border)" }}
            >
              {step <= 7 && (
                <h2 className="text-xl font-bold text-white mb-6">{stepTitle[step]}</h2>
              )}

              {/* Step 1: Name + Email */}
              {step === 1 && (
                <div>
                  <FieldWrapper label="Full Name" error={errors.name}>
                    <TextInput
                      value={data.name}
                      onChange={(v) => set("name", v)}
                      onBlur={() => { const e = validateStep(1, data); if (e.name) setErrors((p) => ({ ...p, name: e.name })); }}
                      placeholder="Jane Smith"
                      error={!!errors.name}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Email Address" error={errors.email}>
                    <TextInput
                      type="email"
                      value={data.email}
                      onChange={(v) => set("email", v)}
                      onBlur={() => { const e = validateStep(1, data); if (e.email) setErrors((p) => ({ ...p, email: e.email })); }}
                      placeholder="jane@yourstore.com"
                      error={!!errors.email}
                    />
                  </FieldWrapper>
                </div>
              )}

              {/* Step 2: Store URL */}
              {step === 2 && (
                <FieldWrapper label="Your Store URL" error={errors.storeUrl}>
                  <TextInput
                    value={data.storeUrl}
                    onChange={(v) => set("storeUrl", v)}
                    onBlur={() => { const e = validateStep(2, data); if (e.storeUrl) setErrors((p) => ({ ...p, storeUrl: e.storeUrl })); }}
                    placeholder="https://yourstore.com"
                    error={!!errors.storeUrl}
                  />
                  {errors.storeUrl && <p className="mt-1.5 text-xs" style={{ color: "var(--color-danger)" }}>{errors.storeUrl}</p>}
                </FieldWrapper>
              )}

              {/* Step 3: Platform */}
              {step === 3 && (
                <div className="space-y-3">
                  {errors.platform && <p className="text-xs mb-3" style={{ color: "var(--color-danger)" }}>{errors.platform}</p>}
                  {[
                    { value: "Shopify", label: "Shopify", sublabel: "The most popular e-commerce platform" },
                    { value: "WooCommerce", label: "WooCommerce", sublabel: "WordPress-based store" },
                    { value: "Other", label: "Other", sublabel: "BigCommerce, Magento, custom, etc." },
                  ].map((opt) => (
                    <RadioCard
                      key={opt.value}
                      value={opt.value}
                      label={opt.label}
                      sublabel={opt.sublabel}
                      selected={data.platform === opt.value}
                      onChange={(v) => set("platform", v)}
                    />
                  ))}
                </div>
              )}

              {/* Step 4: Monthly Ad Spend */}
              {step === 4 && (
                <div className="space-y-3">
                  {errors.monthlySpend && <p className="text-xs mb-3" style={{ color: "var(--color-danger)" }}>{errors.monthlySpend}</p>}
                  {[
                    { value: "Under $5K", label: "Under $5K / month", sublabel: "Just getting started with paid ads" },
                    { value: "$5K-$20K", label: "$5K – $20K / month", sublabel: "Established spend, ready to optimize" },
                    { value: "$20K-$50K", label: "$20K – $50K / month", sublabel: "Serious scale, looking to improve ROAS" },
                    { value: "$50K+", label: "$50K+ / month", sublabel: "High-volume campaigns" },
                  ].map((opt) => (
                    <RadioCard
                      key={opt.value}
                      value={opt.value}
                      label={opt.label}
                      sublabel={opt.sublabel}
                      selected={data.monthlySpend === opt.value}
                      onChange={(v) => set("monthlySpend", v)}
                    />
                  ))}
                </div>
              )}

              {/* Step 5: Primary Goal */}
              {step === 5 && (
                <div className="space-y-3">
                  {errors.goal && <p className="text-xs mb-3" style={{ color: "var(--color-danger)" }}>{errors.goal}</p>}
                  {[
                    { value: "ROAS", label: "Improve ROAS", sublabel: "Maximize return on every dollar spent" },
                    { value: "Revenue Growth", label: "Revenue Growth", sublabel: "Scale top-line revenue aggressively" },
                    { value: "New Customers", label: "Acquire New Customers", sublabel: "Grow my customer base cost-efficiently" },
                  ].map((opt) => (
                    <RadioCard
                      key={opt.value}
                      value={opt.value}
                      label={opt.label}
                      sublabel={opt.sublabel}
                      selected={data.goal === opt.value}
                      onChange={(v) => set("goal", v)}
                    />
                  ))}
                </div>
              )}

              {/* Step 6: Prior Agency */}
              {step === 6 && (
                <div className="space-y-3">
                  {errors.priorAgency && <p className="text-xs mb-3" style={{ color: "var(--color-danger)" }}>{errors.priorAgency}</p>}
                  <p className="text-sm mb-4" style={{ color: "var(--color-text-subtle)" }}>
                    Have you worked with a paid ads agency before?
                  </p>
                  {[
                    { value: "yes", label: "Yes", sublabel: "I've worked with an agency previously" },
                    { value: "no", label: "No", sublabel: "This would be my first agency engagement" },
                  ].map((opt) => (
                    <RadioCard
                      key={opt.value}
                      value={opt.value}
                      label={opt.label}
                      sublabel={opt.sublabel}
                      selected={data.priorAgency === opt.value}
                      onChange={(v) => set("priorAgency", v)}
                    />
                  ))}
                </div>
              )}

              {/* Step 7: How did you find us */}
              {step === 7 && (
                <FieldWrapper label="How did you find out about us?" error={errors.source}>
                  <TextInput
                    value={data.source}
                    onChange={(v) => set("source", v)}
                    placeholder="e.g. Instagram ad, Google, friend referral..."
                    error={!!errors.source}
                  />
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>Optional — just helps us understand where our clients come from.</p>
                </FieldWrapper>
              )}

              <NavButtons
                step={step}
                onBack={() => setStep((s) => s - 1)}
                onNext={validateAndAdvance}
                onSubmit={handleSubmit}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
