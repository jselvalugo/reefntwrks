import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrency, formatRoas } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Campaigns" };

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string; dot?: boolean }> = {
    Active:   { bg: "rgba(34,197,94,0.12)",   color: "#16a34a", label: "Active",    dot: true },
    Paused:   { bg: "rgba(245,158,11,0.12)",  color: "#d97706", label: "Paused" },
    InReview: { bg: "rgba(59,130,246,0.12)",  color: "#2563eb", label: "In Review" },
    Ended:    { bg: "rgba(107,114,128,0.12)", color: "#6b7280", label: "Ended" },
  };
  const s = styles[status] || styles.Ended;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {s.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />}
      {s.label}
    </span>
  );
}

export default async function CampaignsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      campaigns: {
        include: {
          metrics: true,
        },
      },
    },
  });

  if (!client) redirect("/portal/dashboard");

  // Sort: Active first, then by startDate desc
  const sorted = [...client.campaigns].sort((a, b) => {
    if (a.status === "Active" && b.status !== "Active") return -1;
    if (b.status === "Active" && a.status !== "Active") return 1;
    const aDate = a.startDate ? new Date(a.startDate).getTime() : 0;
    const bDate = b.startDate ? new Date(b.startDate).getTime() : 0;
    return bDate - aDate;
  });

  const campaigns = sorted.map((c) => {
    const spend = c.metrics.reduce((s, m) => s + m.spend, 0);
    const revenue = c.metrics.reduce((s, m) => s + m.revenue, 0);
    const roas = spend > 0 ? revenue / spend : null;
    return { ...c, totalSpend: spend, roas };
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Campaigns</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>All campaigns for {client.companyName}</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No campaigns yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>Campaigns will appear here once your account is active.</p>
        </div>
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Campaign", "Status", "Daily Budget", "Total Spend", "ROAS", "Start Date"].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign, i) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : undefined }}
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/portal/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--color-text)" }}
                      >
                        {campaign.name}
                      </Link>
                      {campaign.objective && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{campaign.objective}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={campaign.status} />
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--color-text)" }}>
                      {campaign.dailyBudget ? formatCurrency(campaign.dailyBudget) : "—"}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: "var(--color-text)" }}>
                      {formatCurrency(campaign.totalSpend)}
                    </td>
                    <td
                      className="px-5 py-4 font-semibold"
                      style={{
                        color: campaign.roas !== null && campaign.roas >= (client.roasTarget ?? 2)
                          ? "var(--color-success)"
                          : "var(--color-text)",
                      }}
                    >
                      {campaign.roas !== null ? formatRoas(campaign.roas) : "—"}
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>
                      {campaign.startDate
                        ? new Date(campaign.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
