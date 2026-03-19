"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SectionData {
  brandInfo: Record<string, string>;
  targetAudience: Record<string, string>;
  topProducts: Record<string, string>;
  competitors: Record<string, string>;
  creativeAssets: Record<string, string>;
  goalsKpis: Record<string, string>;
}

type SectionKey = keyof SectionData;

interface Section {
  key: SectionKey;
  title: string;
  description: string;
  fields: { key: string; label: string; placeholder: string; type: "input" | "textarea" }[];
}

// ── Section definitions ───────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    key: "brandInfo",
    title: "Brand Info",
    description: "Tell us about your brand — its identity, story, and positioning.",
    fields: [
      { key: "brandName", label: "Brand Name", placeholder: "e.g. Coastal Co.", type: "input" },
      { key: "tagline", label: "Tagline or Brand Slogan", placeholder: "e.g. Adventure awaits.", type: "input" },
      { key: "brandStory", label: "Brand Story", placeholder: "What inspired you to start this brand?", type: "textarea" },
      { key: "uniqueValue", label: "Unique Value Proposition", placeholder: "What makes your brand different from competitors?", type: "textarea" },
      { key: "brandVoice", label: "Brand Voice & Tone", placeholder: "e.g. Bold and playful, professional but approachable...", type: "textarea" },
    ],
  },
  {
    key: "targetAudience",
    title: "Target Audience",
    description: "Describe who your ideal customers are so we can build precise audiences.",
    fields: [
      { key: "ageRange", label: "Age Range", placeholder: "e.g. 25-44", type: "input" },
      { key: "gender", label: "Gender", placeholder: "e.g. All, Primarily female, etc.", type: "input" },
      { key: "location", label: "Target Locations", placeholder: "e.g. United States, Canada, UK", type: "input" },
      { key: "interests", label: "Key Interests & Behaviors", placeholder: "What do your customers care about, follow, or buy?", type: "textarea" },
      { key: "painPoints", label: "Customer Pain Points", placeholder: "What problem does your product solve for them?", type: "textarea" },
      { key: "purchaseMotivation", label: "Purchase Motivation", placeholder: "Why do they ultimately buy from you?", type: "textarea" },
    ],
  },
  {
    key: "topProducts",
    title: "Top Products",
    description: "Tell us about your best-selling products and hero SKUs.",
    fields: [
      { key: "hero1", label: "Hero Product #1", placeholder: "Product name, price, and what makes it sell", type: "textarea" },
      { key: "hero2", label: "Hero Product #2", placeholder: "Product name, price, and what makes it sell", type: "textarea" },
      { key: "hero3", label: "Hero Product #3 (optional)", placeholder: "Product name, price, and what makes it sell", type: "textarea" },
      { key: "avgOrderValue", label: "Average Order Value (AOV)", placeholder: "e.g. $85", type: "input" },
      { key: "topCategory", label: "Top Product Category", placeholder: "e.g. Skincare, Apparel, Home Goods", type: "input" },
    ],
  },
  {
    key: "competitors",
    title: "Competitors",
    description: "Help us understand your competitive landscape.",
    fields: [
      { key: "mainCompetitors", label: "Main Competitors", placeholder: "List 3-5 direct competitors and their websites", type: "textarea" },
      { key: "competitorStrengths", label: "Competitor Strengths", placeholder: "What do they do well that you want to beat?", type: "textarea" },
      { key: "competitorWeaknesses", label: "Competitor Weaknesses", placeholder: "Where do they fall short? What can you exploit?", type: "textarea" },
      { key: "marketPosition", label: "Your Market Position", placeholder: "Are you premium, budget, niche? How do you position vs. competitors?", type: "textarea" },
    ],
  },
  {
    key: "creativeAssets",
    title: "Creative Assets",
    description: "Tell us about your existing creative assets and preferences.",
    fields: [
      { key: "existingAssets", label: "Existing Creative Assets", placeholder: "Do you have photos, videos, UGC, or other assets ready?", type: "textarea" },
      { key: "creativeLinks", label: "Asset Links / Drive Folder", placeholder: "Link to Google Drive, Dropbox, or asset library", type: "input" },
      { key: "creativePreferences", label: "Creative Preferences & Style", placeholder: "Any visual style, colors, or formats you prefer or want to avoid?", type: "textarea" },
      { key: "ugcAccess", label: "UGC / Influencer Access", placeholder: "Do you have any UGC creators or influencers you work with?", type: "textarea" },
    ],
  },
  {
    key: "goalsKpis",
    title: "Goals & KPIs",
    description: "Define your success metrics so we can optimize to them.",
    fields: [
      { key: "roasTarget", label: "Target ROAS", placeholder: "e.g. 3.5x", type: "input" },
      { key: "cppTarget", label: "Target Cost Per Purchase (CPP)", placeholder: "e.g. $25", type: "input" },
      { key: "monthlyRevenueGoal", label: "Monthly Revenue Goal", placeholder: "e.g. $150,000", type: "input" },
      { key: "primaryKpi", label: "Primary KPI", placeholder: "e.g. ROAS, revenue, new customers, CPP...", type: "input" },
      { key: "additionalGoals", label: "Additional Goals or Notes", placeholder: "Anything else we should know to make this a success?", type: "textarea" },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
          Section {current} of {total} — {SECTIONS[current - 1]?.title}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--color-coral)" }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--color-surface-2)" }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: "var(--color-coral)" }}
        />
      </div>
      <div className="flex gap-1 mt-2">
        {SECTIONS.map((s, i) => (
          <div
            key={s.key}
            className="flex-1 h-1 rounded-full"
            style={{
              background: i < current ? "var(--color-coral)" : "var(--color-surface-2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [formData, setFormData] = useState<SectionData>({
    brandInfo: {},
    targetAudience: {},
    topProducts: {},
    competitors: {},
    creativeAssets: {},
    goalsKpis: {},
  });

  // Load saved progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("reef_onboarding");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch { /* ignore */ }
    }
  }, []);

  const section = SECTIONS[sectionIndex];
  const isLast = sectionIndex === SECTIONS.length - 1;

  const setField = useCallback((sectionKey: SectionKey, fieldKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [sectionKey]: { ...prev[sectionKey], [fieldKey]: value },
    }));
  }, []);

  const saveProgress = useCallback(async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    setSaveStatus("idle");

    // Persist locally
    localStorage.setItem("reef_onboarding", JSON.stringify(formData));

    try {
      const res = await fetch(`/api/v1/clients/${session.user.id}/onboarding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingData: formData, complete: false }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [session?.user?.id, formData]);

  const handleNext = async () => {
    await saveProgress();
    setSectionIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSectionIndex((i) => i - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleComplete = async () => {
    if (!session?.user?.id) return;
    setCompleting(true);
    localStorage.setItem("reef_onboarding", JSON.stringify(formData));

    try {
      await fetch(`/api/v1/clients/${session.user.id}/onboarding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingData: formData, complete: true }),
      });
    } catch { /* proceed */ }

    localStorage.removeItem("reef_onboarding");
    setCompleting(false);
    router.push("/portal/dashboard");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-coral)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: "var(--color-surface)" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Client Onboarding</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Help us understand your brand so we can build campaigns that actually work.
          </p>
        </div>

        <ProgressBar current={sectionIndex + 1} total={SECTIONS.length} />

        {/* Section card */}
        <div className="card-surface rounded-2xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--color-text)" }}>{section.title}</h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{section.description}</p>
          </div>

          <div className="space-y-5">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>
                  {field.label}
                </label>
                {field.type === "input" ? (
                  <input
                    type="text"
                    value={formData[section.key][field.key] ?? ""}
                    onChange={(e) => setField(section.key, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                ) : (
                  <textarea
                    rows={3}
                    value={formData[section.key][field.key] ?? ""}
                    onChange={(e) => setField(section.key, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-y"
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save status banner */}
        {saveStatus === "saved" && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--color-success)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Progress saved.
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {sectionIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl text-sm font-medium border transition-all"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={saveProgress}
            disabled={saving}
            className="py-3 px-5 rounded-xl text-sm font-medium border transition-all disabled:opacity-60"
            style={{ borderColor: "var(--color-coral)", color: "var(--color-coral)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: "var(--color-coral)" }}
            >
              {completing ? "Completing…" : "Complete Onboarding"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: "var(--color-coral)" }}
            >
              Save & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
