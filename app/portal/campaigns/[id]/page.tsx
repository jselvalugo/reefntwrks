"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatRoas, aggregateMetrics } from "@/lib/utils";

type DateRange = "7" | "30" | "month";

interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number | null;
  startDate: string | null;
  metrics: Metric[];
  creatives: Creative[];
}

interface Metric {
  date: string;
  spend: number;
  revenue: number;
  impressions: number;
  clicks: number;
  purchases: number;
  roas: number | null;
  ctr: number | null;
  cpp: number | null;
}

interface Creative {
  id: string;
  name: string;
  type: string;
  frequency: number;
  ctr: number | null;
  roas: number | null;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
    Paused: { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
    InReview: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    Ended: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  };
  const s = map[status] || map.Ended;
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {status === "InReview" ? "In Review" : status}
    </span>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-4 rounded-xl">
      <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{value}</p>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [range, setRange] = useState<DateRange>("30");
  const [loading, setLoading] = useState(true);

  const fetchCampaign = useCallback(async () => {
    const now = new Date();
    let startDate: string;
    if (range === "7") {
      const d = new Date(now); d.setDate(now.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    } else if (range === "30") {
      const d = new Date(now); d.setDate(now.getDate() - 30);
      startDate = d.toISOString().split("T")[0];
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    }
    const endDate = now.toISOString().split("T")[0];
    const res = await fetch(`/api/v1/campaigns/${id}?startDate=${startDate}&endDate=${endDate}`);
    if (res.ok) setCampaign(await res.json());
    setLoading(false);
  }, [id, range]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-coral)" }} />
    </div>
  );
  if (!campaign) return <div className="p-8 text-sm" style={{ color: "var(--color-danger)" }}>Campaign not found.</div>;

  const agg = aggregateMetrics(campaign.metrics);
  const chartData = campaign.metrics.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Spend: Math.round(m.spend),
    ROAS: m.roas ? Number(m.roas.toFixed(2)) : 0,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/portal/campaigns" className="text-sm transition-colors hover:underline" style={{ color: "var(--color-text-muted)" }}>Campaigns</a>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={campaign.status} />
            {campaign.dailyBudget && (
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {formatCurrency(campaign.dailyBudget)}/day
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(["7", "30", "month"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={
                range === r
                  ? { background: "var(--color-coral)", color: "white" }
                  : { background: "var(--color-surface-2)", color: "var(--color-text-muted)" }
              }
            >
              {r === "7" ? "Last 7 days" : r === "30" ? "Last 30 days" : "This month"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label="Total Spend" value={formatCurrency(agg.spend)} />
        <MetricCard label="ROAS" value={formatRoas(agg.roas)} />
        <MetricCard label="Revenue" value={formatCurrency(agg.revenue)} />
        <MetricCard label="Purchases" value={String(agg.purchases)} />
        <MetricCard label="Impressions" value={agg.impressions.toLocaleString()} />
        <MetricCard label="Clicks" value={agg.clicks.toLocaleString()} />
        <MetricCard label="CTR" value={`${agg.ctr.toFixed(2)}%`} />
        <MetricCard label="CPP" value={agg.cpp > 0 ? formatCurrency(agg.cpp) : "—"} />
      </div>

      {/* Chart */}
      <div className="card-surface p-6 rounded-2xl">
        <h2 className="text-sm font-semibold mb-6" style={{ color: "var(--color-text)" }}>Daily Spend & ROAS</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} />
            <YAxis yAxisId="left" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} tickFormatter={(v) => `${v}x`} />
            <Tooltip
              contentStyle={{ background: "white", border: "1px solid var(--color-border)", borderRadius: "8px" }}
              labelStyle={{ color: "var(--color-text)", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="left" type="monotone" dataKey="Spend" stroke="var(--color-coral)" strokeWidth={2} dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="ROAS" stroke="var(--color-teal)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Creatives */}
      <div>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>Creatives</h2>
        {campaign.creatives.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No creatives attached to this campaign yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaign.creatives.map((creative) => (
              <div
                key={creative.id}
                className="card-surface p-5 rounded-xl relative"
                style={{
                  border: creative.frequency > 4
                    ? "1px solid rgba(245,158,11,0.4)"
                    : "1px solid var(--color-border)",
                }}
              >
                {creative.frequency > 4 && (
                  <div
                    className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(255,107,71,0.12)", color: "var(--color-coral)" }}
                  >
                    High Frequency
                  </div>
                )}
                <div className="mb-3 pr-28">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>{creative.name}</p>
                  <span
                    className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs capitalize"
                    style={{ background: "var(--color-surface-2)", color: "var(--color-text-muted)" }}
                  >
                    {creative.type}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Frequency", value: creative.frequency.toFixed(1) },
                    { label: "CTR", value: creative.ctr ? `${creative.ctr.toFixed(2)}%` : "—" },
                    { label: "ROAS", value: creative.roas ? formatRoas(creative.roas) : "—" },
                  ].map((stat) => (
                    <div key={stat.label} className="p-2 rounded-lg" style={{ background: "var(--color-surface-2)" }}>
                      <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
