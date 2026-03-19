import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricCard {
  label: string;
  value: string;
  change: number; // percentage vs prior period
  prefix?: string;
  suffix?: string;
  colorLogic?: "roas";
  roasTarget?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 1)}M`;
  if (n >= 1_000) return `$${fmt(n / 1_000, 1)}K`;
  return `$${fmt(n, 0)}`;
}

function roasColor(roas: number, target: number): string {
  if (roas >= target) return "var(--color-success)";
  if (roas >= target * 0.9) return "var(--color-warning)";
  return "var(--color-danger)";
}

// ── Metric Card component ─────────────────────────────────────────────────────

function MetricCardUI({ card }: { card: MetricCard }) {
  const isPositive = card.change >= 0;
  const color =
    card.colorLogic === "roas" && card.roasTarget
      ? roasColor(parseFloat(card.value.replace("x", "")), card.roasTarget)
      : undefined;

  return (
    <div className="card-surface p-6 rounded-2xl">
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
        {card.label}
      </p>
      <p className="text-3xl font-bold mb-2" style={{ color: color ?? "var(--color-text)" }}>
        {card.prefix}{card.value}{card.suffix}
      </p>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-green-600" : "text-red-500"}`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d={isPositive ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
        {Math.abs(card.change)}% vs prior period
      </div>
    </div>
  );
}

// ── Onboarding checklist ──────────────────────────────────────────────────────

function OnboardingChecklist({ data }: { data: Record<string, unknown> | null }) {
  const sections = [
    { key: "brandInfo", label: "Brand Info" },
    { key: "targetAudience", label: "Target Audience" },
    { key: "topProducts", label: "Top Products" },
    { key: "competitors", label: "Competitors" },
    { key: "creativeAssets", label: "Creative Assets" },
    { key: "goalsKpis", label: "Goals & KPIs" },
  ];

  const completed = sections.filter((s) => data && data[s.key]).length;
  const total = sections.length;

  if (completed === total) return null;

  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{ background: "#FFF7F5", border: "1px solid rgba(255,107,71,0.25)" }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Complete Your Onboarding</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {completed}/{total} sections complete
          </p>
        </div>
        <a
          href="/portal/onboarding"
          className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-lg text-white"
          style={{ background: "var(--color-coral)" }}
        >
          Continue
        </a>
      </div>
      <div className="h-2 rounded-full mb-4" style={{ background: "var(--color-surface-2)" }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${(completed / total) * 100}%`, background: "var(--color-coral)" }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {sections.map((s) => {
          const done = !!(data && data[s.key]);
          return (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: done ? "var(--color-success)" : "var(--color-surface-2)" }}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span style={{ color: done ? "var(--color-text)" : "var(--color-text-muted)" }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      campaigns: {
        where: { status: "Active" },
        include: {
          metrics: {
            orderBy: { date: "desc" },
            take: 60,
          },
        },
      },
    },
  });

  if (!client) redirect("/login");

  // Redirect to onboarding if still onboarding and no data
  if (client.status === "Onboarding" && !client.onboardingData) {
    redirect("/portal/onboarding");
  }

  // ── Aggregate metrics for current month ──────────────────────────────────
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  let totalSpend = 0, totalRevenue = 0, totalPurchases = 0;
  let prevSpend = 0, prevRevenue = 0;

  const topCampaignsByRoas: { name: string; roas: number }[] = [];

  for (const campaign of client.campaigns) {
    for (const m of campaign.metrics) {
      const d = new Date(m.date);
      if (d >= currentMonthStart) {
        totalSpend += m.spend;
        totalRevenue += m.revenue;
        totalPurchases += m.purchases;
      }
      if (d >= prevMonthStart && d <= prevMonthEnd) {
        prevSpend += m.spend;
        prevRevenue += m.revenue;
      }
    }

    const campaignTotalSpend = campaign.metrics.reduce((s: number, m: { spend: number }) => s + m.spend, 0);
    const campaignTotalRevenue = campaign.metrics.reduce((s: number, m: { revenue: number }) => s + m.revenue, 0);
    const campaignRoas = campaignTotalSpend > 0 ? campaignTotalRevenue / campaignTotalSpend : 0;
    topCampaignsByRoas.push({ name: campaign.name, roas: campaignRoas });
  }

  topCampaignsByRoas.sort((a, b) => b.roas - a.roas);
  const topAd = topCampaignsByRoas[0] ?? null;

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0;

  const spendChange = prevSpend > 0 ? Math.round(((totalSpend - prevSpend) / prevSpend) * 100) : 0;
  const roasChange = prevRoas > 0 ? Math.round(((roas - prevRoas) / prevRoas) * 100) : 0;
  const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;

  const cards: MetricCard[] = [
    { label: "Total Spend (MTD)", value: fmtCurrency(totalSpend).replace("$", ""), prefix: "$", change: spendChange },
    {
      label: "ROAS",
      value: fmt(roas, 2),
      suffix: "x",
      change: roasChange,
      colorLogic: "roas",
      roasTarget: client.roasTarget ?? 2,
    },
    { label: "Revenue Attributed", value: fmtCurrency(totalRevenue).replace("$", ""), prefix: "$", change: revenueChange },
    { label: "Active Campaigns", value: String(client.campaigns.length), change: 0 },
  ];

  const onboardingData = client.onboardingData as Record<string, unknown> | null;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          {client.companyName} · {client.status} ·{" "}
          {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Onboarding checklist */}
      <OnboardingChecklist data={onboardingData} />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((card) => (
          <MetricCardUI key={card.label} card={card} />
        ))}
      </div>

      {/* Bottom section: top campaign + quick links */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Top performing ad */}
        <div className="card-surface p-6 rounded-2xl">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Top Performing Campaign
          </h2>
          {topAd ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>{topAd.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Highest ROAS this period</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: "var(--color-success)" }}>{fmt(topAd.roas, 2)}x</p>
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>ROAS</p>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No active campaigns yet.</p>
          )}
        </div>

        {/* Quick links */}
        <div className="card-surface p-6 rounded-2xl">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text)" }}>Quick Links</h2>
          <div className="space-y-2">
            {[
              { href: "/portal/campaigns", label: "View All Campaigns" },
              { href: "/portal/reports", label: "Download Reports" },
              { href: "/portal/briefs", label: "Review Campaign Briefs" },
              { href: "/portal/messages", label: "Messages" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:bg-gray-50 group"
              >
                <span className="text-sm" style={{ color: "var(--color-text)" }}>{link.label}</span>
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-muted)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
