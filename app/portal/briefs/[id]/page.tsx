"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface BriefContent {
  campaignName?: string;
  objective?: string;
  targetAudience?: string;
  dailyBudget?: number;
  totalBudget?: number;
  adFormats?: string[];
  creativeDirection?: string;
  kpiTargets?: { roas?: number; cpp?: number; ctr?: number };
}

interface Brief {
  id: string;
  title: string;
  status: string;
  content: BriefContent | null;
  history: Array<{ status: string; timestamp: string; feedback?: string; by?: string }> | null;
  createdAt: string;
}

function BriefStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: "rgba(107,114,128,0.12)", color: "#6b7280", label: "Draft" },
    awaiting_approval: { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Awaiting Approval" },
    approved: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Approved" },
    changes_requested: { bg: "rgba(255,107,71,0.12)", color: "#FF6B47", label: "Changes Requested" },
  };
  const s = map[status] || map.draft;
  return (
    <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-sm" style={{ color: "var(--color-text)" }}>{value}</p>
    </div>
  );
}

export default function BriefDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session } = useSession();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChangesInput, setShowChangesInput] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/briefs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setBrief(d);
        setLoading(false);
      });
  }, [id]);

  async function handleApprove() {
    setSubmitting(true);
    const res = await fetch(`/api/v1/briefs/${id}/approve`, { method: "POST" });
    if (res.ok) {
      const updated = await res.json();
      setBrief(updated);
    }
    setSubmitting(false);
  }

  async function handleRequestChanges() {
    if (!feedback.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/v1/briefs/${id}/request-changes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBrief(updated);
      setShowChangesInput(false);
      setFeedback("");
    }
    setSubmitting(false);
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-coral)" }} />
    </div>
  );
  if (!brief) return <div className="p-8 text-sm" style={{ color: "var(--color-danger)" }}>Brief not found.</div>;

  const content = brief.content || {};
  const history = brief.history || [];
  const canAction = brief.status === "awaiting_approval";

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm transition-colors hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Briefs
          </button>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{brief.title}</h1>
          <BriefStatusBadge status={brief.status} />
        </div>
      </div>

      {/* Content */}
      <div className="card-surface rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Campaign Details</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <InfoRow label="Campaign Name" value={content.campaignName} />
          <InfoRow label="Objective" value={content.objective} />
          <InfoRow label="Daily Budget" value={content.dailyBudget ? `$${content.dailyBudget.toLocaleString()}` : undefined} />
          <InfoRow label="Total Budget" value={content.totalBudget ? `$${content.totalBudget.toLocaleString()}` : undefined} />
        </div>

        {content.targetAudience && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Target Audience</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{content.targetAudience}</p>
          </div>
        )}

        {content.adFormats && content.adFormats.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: "var(--color-text-muted)" }}>Ad Formats</p>
            <div className="flex gap-2 flex-wrap">
              {content.adFormats.map((f: string) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-full text-xs font-medium capitalize"
                  style={{ background: "var(--color-surface-2)", color: "var(--color-text)" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {content.creativeDirection && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Creative Direction</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>{content.creativeDirection}</p>
          </div>
        )}

        {content.kpiTargets && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-3" style={{ color: "var(--color-text-muted)" }}>KPI Targets</p>
            <div className="grid grid-cols-3 gap-4">
              {content.kpiTargets.roas && (
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>ROAS</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{content.kpiTargets.roas}x</p>
                </div>
              )}
              {content.kpiTargets.cpp && (
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>CPP</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>${content.kpiTargets.cpp}</p>
                </div>
              )}
              {content.kpiTargets.ctr && (
                <div className="text-center p-3 rounded-xl" style={{ background: "var(--color-surface-2)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>CTR</p>
                  <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>{content.kpiTargets.ctr}%</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions — hidden if already approved */}
      {canAction && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white"
              style={{ background: "var(--color-success)" }}
            >
              {submitting ? "Approving…" : "Approve Brief"}
            </button>
            <button
              onClick={() => setShowChangesInput(!showChangesInput)}
              className="px-6 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: "var(--color-coral)", color: "var(--color-coral)" }}
            >
              Request Changes
            </button>
          </div>
          {showChangesInput && (
            <div className="card-surface rounded-2xl p-5 space-y-3">
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>What changes would you like to see?</p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the changes clearly so we can action them quickly…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <button
                onClick={handleRequestChanges}
                disabled={submitting || !feedback.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "var(--color-coral)" }}
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>Status History</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div
                key={i}
                className="card-surface flex gap-3 p-4 rounded-xl"
              >
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--color-coral)" }} />
                <div>
                  <p className="text-sm font-medium capitalize" style={{ color: "var(--color-text)" }}>{h.status.replace(/_/g, " ")}</p>
                  {h.feedback && <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{h.feedback}</p>}
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>
                    {new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {h.by ? ` · ${h.by}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
