import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat("en-US", opts).format(n);
}

function fmtCurrency(n: number) {
  return fmt(n, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function fmtPercent(n: number, decimals = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
}

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/portal/dashboard");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all clients with campaigns + metrics
  const clients = await prisma.client.findMany({
    include: {
      campaigns: {
        include: {
          metrics: {
            where: { date: { gte: thirtyDaysAgo } },
            orderBy: { date: "desc" },
          },
        },
      },
      reports: { orderBy: { generatedAt: "desc" }, take: 1 },
      alerts: { where: { status: "open" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const openLeads = await prisma.lead.count({ where: { status: { not: "Converted" }, NOT: { status: "Lost" } } });
  const openAlertsCount = await prisma.alert.count({ where: { status: "open" } });

  // Stat computations
  const activeClients = clients.filter((c) => c.status === "Active");
  const totalMRR = clients
    .filter((c) => c.status === "Active" || c.status === "Onboarding")
    .reduce((sum, c) => {
      const tier = c.retainerTier ?? "";
      const match = tier.match(/[\d,]+/);
      return sum + (match ? Number(match[0].replace(/,/g, "")) : 0);
    }, 0);

  // Total ad spend this month — sum across all active client campaigns metrics
  const monthlySpend = clients.reduce((sum, c) => {
    return (
      sum +
      c.campaigns.reduce((cs, camp) => {
        return (
          cs +
          camp.metrics
            .filter((m) => new Date(m.date) >= monthStart)
            .reduce((ms, m) => ms + m.spend, 0)
        );
      }, 0)
    );
  }, 0);

  // Build per-client health rows
  type HealthRow = {
    id: string;
    companyName: string;
    retainerTier: string | null;
    currentROAS: number | null;
    roasTarget: number | null;
    roasDeltaPct: number | null;
    lastReportDate: Date | null;
    noRecentReport: boolean;
    roasBelowTarget: boolean;
    status: string;
    alertCount: number;
  };

  const healthRows: HealthRow[] = clients.map((c) => {
    // Average ROAS across all campaigns last 30 days
    const allMetrics = c.campaigns.flatMap((camp) => camp.metrics);
    const roasValues = allMetrics.filter((m) => m.roas !== null).map((m) => m.roas as number);
    const currentROAS = roasValues.length > 0 ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : null;

    const roasTarget = c.roasTarget ?? null;
    let roasDeltaPct: number | null = null;
    if (currentROAS !== null && roasTarget !== null && roasTarget > 0) {
      roasDeltaPct = ((currentROAS - roasTarget) / roasTarget) * 100;
    }

    const lastReportDate = c.reports[0]?.generatedAt ?? null;
    const noRecentReport = !lastReportDate || lastReportDate < thirtyDaysAgo;
    const roasBelowTarget = roasDeltaPct !== null && roasDeltaPct < -10;

    return {
      id: c.id,
      companyName: c.companyName,
      retainerTier: c.retainerTier,
      currentROAS,
      roasTarget,
      roasDeltaPct,
      lastReportDate,
      noRecentReport,
      roasBelowTarget,
      status: c.status,
      alertCount: c.alerts.length,
    };
  });

  const statCards = [
    {
      label: "Total Active Clients",
      value: activeClients.length.toString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: "var(--color-coral)",
      sub: `${clients.length} total clients`,
    },
    {
      label: "Total MRR",
      value: fmtCurrency(totalMRR),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "var(--color-teal)",
      sub: "From retainer tiers",
    },
    {
      label: "Ad Spend This Month",
      value: fmtCurrency(monthlySpend),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "var(--color-info)",
      sub: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
    },
    {
      label: "Open Leads",
      value: openLeads.toString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "var(--color-warning)",
      sub: (
        <Link href="/admin/leads" className="hover:underline" style={{ color: "var(--color-coral)" }}>
          View pipeline →
        </Link>
      ),
    },
  ];

  const statusColor: Record<string, string> = {
    Active: "var(--color-success)",
    Onboarding: "var(--color-info)",
    Paused: "var(--color-warning)",
    Churned: "var(--color-danger)",
  };

  const statusBg: Record<string, string> = {
    Active: "rgba(34,197,94,0.1)",
    Onboarding: "rgba(59,130,246,0.1)",
    Paused: "rgba(245,158,11,0.1)",
    Churned: "rgba(239,68,68,0.1)",
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Overview of all client performance
          </p>
        </div>
        {openAlertsCount > 0 && (
          <Link
            href="/admin/alerts"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#DC2626",
              border: "1px solid rgba(239,68,68,0.25)",
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {openAlertsCount} open alert{openAlertsCount !== 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${card.color}18`, color: card.color }}
              >
                {card.icon}
              </div>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ color: "var(--color-text)" }}>
              {card.value}
            </div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>
              {card.label}
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Client Health Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <h2 className="font-semibold text-base" style={{ color: "var(--color-text)" }}>
            Client Health
          </h2>
          <Link href="/admin/clients" className="text-xs font-medium hover:underline" style={{ color: "var(--color-coral)" }}>
            View all clients →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Company</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Retainer</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>ROAS (30d)</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>vs Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Last Report</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {healthRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    No clients yet. <Link href="/admin/clients" className="hover:underline" style={{ color: "var(--color-coral)" }}>Add your first client →</Link>
                  </td>
                </tr>
              )}
              {healthRows.map((row) => (
                <Link key={row.id} href={`/admin/clients/${row.id}`} legacyBehavior>
                  <tr
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: row.roasBelowTarget ? "rgba(239,68,68,0.04)" : undefined,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = row.roasBelowTarget
                        ? "rgba(239,68,68,0.09)"
                        : "var(--color-surface)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = row.roasBelowTarget
                        ? "rgba(239,68,68,0.04)"
                        : "";
                    }}
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-medium" style={{ color: "var(--color-text)" }}>
                        {row.companyName}
                      </span>
                      {row.alertCount > 0 && (
                        <span
                          className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: "rgba(239,68,68,0.12)", color: "#DC2626" }}
                        >
                          {row.alertCount}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      {row.retainerTier ?? <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums" style={{ color: "var(--color-text)" }}>
                      {row.currentROAS !== null ? `${row.currentROAS.toFixed(2)}x` : <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono tabular-nums">
                      {row.roasDeltaPct !== null ? (
                        <span
                          className="font-semibold"
                          style={{ color: row.roasDeltaPct >= 0 ? "var(--color-success)" : "var(--color-danger)" }}
                        >
                          {fmtPercent(row.roasDeltaPct)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      <span className="flex items-center gap-1.5">
                        {row.noRecentReport && (
                          <span title="No report in 30+ days" aria-label="No report in 30+ days">
                            ⚠️
                          </span>
                        )}
                        {row.lastReportDate
                          ? row.lastReportDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : <span style={{ color: "var(--color-text-subtle)" }}>Never</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: statusBg[row.status] ?? "rgba(107,114,128,0.1)",
                          color: statusColor[row.status] ?? "var(--color-text-muted)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: statusColor[row.status] ?? "var(--color-text-muted)" }}
                        />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
