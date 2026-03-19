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
      <p className="text-xs uppercase tracking-wider font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-200">{value}</p>
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

  if (loading) return <div className="text-gray-400 p-8">Loading brief…</div>;
  if (!brief) return <div className="text-red-400 p-8">Brief not found.</div>;

  const content = brief.content || {};
  const history = brief.history || [];
  const canAction = brief.status === "awaiting_approval";

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{brief.title}</h1>
          <BriefStatusBadge status={brief.status} />
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}>
        <h2 className="text-sm font-semibold text-white">Campaign Details</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          <InfoRow label="Campaign Name" value={content.campaignName} />
          <InfoRow label="Objective" value={content.objective} />
          <InfoRow label="Daily Budget" value={content.dailyBudget ? `$${content.dailyBudget.toLocaleString()}` : undefined} />
          <InfoRow label="Total Budget" value={content.totalBudget ? `$${content.totalBudget.toLocaleString()}` : undefined} />
        </div>

        {content.targetAudience && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Target Audience</p>
            <p className="text-sm text-gray-200">{content.targetAudience}</p>
          </div>
        )}

        {content.adFormats && content.adFormats.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-2">Ad Formats</p>
            <div className="flex gap-2 flex-wrap">
              {content.adFormats.map((f: string) => (
                <span
                  key={f}
                  className="px-2.5 py-0.5 rounded-full text-xs capitalize"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#d1d5db" }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {content.creativeDirection && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-1">Creative Direction</p>
            <p className="text-sm text-gray-200 leading-relaxed">{content.creativeDirection}</p>
          </div>
        )}

        {content.kpiTargets && (
          <div>
            <p className="text-xs uppercase tracking-wider font-medium text-gray-500 mb-3">KPI Targets</p>
            <div className="grid grid-cols-3 gap-4">
              {content.kpiTargets.roas && (
                <div className="text-center p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-gray-400">ROAS</p>
                  <p className="text-lg font-bold text-white">{content.kpiTargets.roas}x</p>
                </div>
              )}
              {content.kpiTargets.cpp && (
                <div className="text-center p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-gray-400">CPP</p>
                  <p className="text-lg font-bold text-white">${content.kpiTargets.cpp}</p>
                </div>
              )}
              {content.kpiTargets.ctr && (
                <div className="text-center p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-xs text-gray-400">CTR</p>
                  <p className="text-lg font-bold text-white">{content.kpiTargets.ctr}%</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {canAction && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              style={{ background: "#22c55e", color: "white" }}
            >
              Approve Brief
            </button>
            <button
              onClick={() => setShowChangesInput(!showChangesInput)}
              className="px-6 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: "rgba(255,107,71,0.4)", color: "#FF6B47" }}
            >
              Request Changes
            </button>
          </div>
          {showChangesInput && (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Describe the changes you'd like to see…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm bg-transparent text-white placeholder-gray-600 resize-none"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              />
              <button
                onClick={handleRequestChanges}
                disabled={submitting || !feedback.trim()}
                className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: "#FF6B47", color: "white" }}
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">History</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div
                key={i}
                className="flex gap-3 p-4 rounded-lg"
                style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#FF6B47" }} />
                <div>
                  <p className="text-sm text-white capitalize">{h.status.replace(/_/g, " ")}</p>
                  {h.feedback && <p className="text-xs text-gray-400 mt-1">{h.feedback}</p>}
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    {h.by ? ` by ${h.by}` : ""}
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
