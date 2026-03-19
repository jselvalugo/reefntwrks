"use client";

import React, { useState, useEffect, useCallback } from "react";

interface Alert {
  id: string;
  type: string;
  currentValue: number | null;
  priorValue: number | null;
  threshold: number | null;
  status: string;
  dismissNote: string | null;
  createdAt: string;
  client: { companyName: string };
  campaign: { name: string } | null;
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  roas_drop: "ROAS Drop",
  high_frequency: "High Frequency",
  budget_overpace: "Budget Overpace",
  budget_underpace: "Budget Underpace",
};

function pctChange(current: number | null, prior: number | null): number | null {
  if (current === null || prior === null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

function fmt2(n: number) {
  return n.toFixed(2);
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AlertTypeBadge({ type }: { type: string }) {
  const color =
    type === "roas_drop"
      ? { bg: "rgba(239,68,68,0.12)", color: "#DC2626", border: "rgba(239,68,68,0.25)" }
      : type === "high_frequency"
      ? { bg: "rgba(245,158,11,0.12)", color: "#B45309", border: "rgba(245,158,11,0.25)" }
      : type === "budget_overpace"
      ? { bg: "rgba(168,85,247,0.12)", color: "#7C3AED", border: "rgba(168,85,247,0.25)" }
      : { bg: "rgba(59,130,246,0.12)", color: "#2563EB", border: "rgba(59,130,246,0.25)" };

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: color.bg, color: color.color, border: `1px solid ${color.border}` }}
    >
      {ALERT_TYPE_LABELS[type] ?? type}
    </span>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [dismissNote, setDismissNote] = useState<Record<string, string>>({});
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const res = await fetch("/api/v1/alerts");
    if (res.ok) {
      const data: Alert[] = await res.json();
      // Sort by largest % drop first (most negative first)
      data.sort((a, b) => {
        const pa = pctChange(a.currentValue, a.priorValue) ?? 0;
        const pb = pctChange(b.currentValue, b.priorValue) ?? 0;
        return pa - pb;
      });
      setAlerts(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  async function markReviewed(alertId: string) {
    setActingId(alertId);
    try {
      const res = await fetch(`/api/v1/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "reviewed" }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } finally {
      setActingId(null);
    }
  }

  async function dismiss(alertId: string) {
    setActingId(alertId);
    try {
      const note = dismissNote[alertId] ?? "";
      const res = await fetch(`/api/v1/alerts/${alertId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed", dismissNote: note }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        setDismissingId(null);
      }
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Alerts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {loading ? "…" : `${alerts.length} open alert${alerts.length !== 1 ? "s" : ""} — sorted by severity`}
          </p>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                {["Client", "Campaign", "Alert Type", "Current Value", "Prior Value", "% Change", "Created", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    Loading alerts…
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center" style={{ color: "var(--color-text-subtle)" }}>
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">All clear — no open alerts</p>
                    </div>
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => {
                  const pct = pctChange(alert.currentValue, alert.priorValue);
                  const isDropping = pct !== null && pct < 0;
                  const isDismissRowOpen = dismissingId === alert.id;

                  return (
                    <React.Fragment key={alert.id}>
                      <tr
                        className="transition-colors"
                        style={{
                          borderBottom: isDismissRowOpen ? "none" : "1px solid var(--color-border)",
                          background: isDropping ? "rgba(239,68,68,0.03)" : undefined,
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = isDropping
                            ? "rgba(239,68,68,0.07)"
                            : "var(--color-surface)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = isDropping
                            ? "rgba(239,68,68,0.03)"
                            : "")
                        }
                      >
                        <td className="px-5 py-3.5 font-medium" style={{ color: "var(--color-text)" }}>
                          {alert.client.companyName}
                        </td>
                        <td className="px-5 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                          {alert.campaign?.name ?? <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          <AlertTypeBadge type={alert.type} />
                        </td>
                        <td className="px-5 py-3.5 font-mono tabular-nums" style={{ color: "var(--color-text)" }}>
                          {alert.currentValue !== null ? fmt2(alert.currentValue) : "—"}
                        </td>
                        <td className="px-5 py-3.5 font-mono tabular-nums" style={{ color: "var(--color-text-muted)" }}>
                          {alert.priorValue !== null ? fmt2(alert.priorValue) : "—"}
                        </td>
                        <td className="px-5 py-3.5 font-mono tabular-nums font-semibold">
                          {pct !== null ? (
                            <span style={{ color: pct >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                              {pct >= 0 ? "+" : ""}
                              {pct.toFixed(1)}%
                            </span>
                          ) : (
                            <span style={{ color: "var(--color-text-subtle)" }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                          {fmtDate(alert.createdAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              disabled={actingId === alert.id}
                              onClick={() => markReviewed(alert.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                              style={{
                                background: "rgba(34,197,94,0.1)",
                                color: "#16A34A",
                                border: "1px solid rgba(34,197,94,0.2)",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.2)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.1)")}
                            >
                              {actingId === alert.id ? "…" : "Mark Reviewed"}
                            </button>
                            <button
                              disabled={actingId === alert.id}
                              onClick={() => setDismissingId(isDismissRowOpen ? null : alert.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                              style={{
                                background: "var(--color-surface)",
                                color: "var(--color-text-muted)",
                                border: "1px solid var(--color-border)",
                              }}
                              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)")}
                              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                            >
                              Dismiss
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isDismissRowOpen && (
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td
                            colSpan={8}
                            className="px-5 pb-4"
                            style={{ background: "rgba(239,68,68,0.03)" }}
                          >
                            <div className="flex items-center gap-3 mt-1">
                              <input
                                type="text"
                                placeholder="Dismiss reason (optional)…"
                                value={dismissNote[alert.id] ?? ""}
                                onChange={(e) =>
                                  setDismissNote((prev) => ({ ...prev, [alert.id]: e.target.value }))
                                }
                                className="flex-1 text-sm px-3 py-2 rounded-lg border outline-none transition-all"
                                style={{
                                  border: "1px solid var(--color-border)",
                                  background: "#fff",
                                  color: "var(--color-text)",
                                }}
                                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                              />
                              <button
                                onClick={() => dismiss(alert.id)}
                                disabled={actingId === alert.id}
                                className="px-4 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                                style={{ background: "var(--color-danger)", color: "#fff" }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                              >
                                {actingId === alert.id ? "Dismissing…" : "Confirm Dismiss"}
                              </button>
                              <button
                                onClick={() => setDismissingId(null)}
                                className="text-xs px-3 py-2 rounded-lg transition-all"
                                style={{ color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
