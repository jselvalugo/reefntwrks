import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/admin/dashboard - Summary stats for admin dashboard
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalClients, openLeads, openAlerts, clients, totalSpendResult] = await Promise.all([
    prisma.client.count({ where: { status: "Active" } }),
    prisma.lead.count({ where: { status: { in: ["New", "Contacted", "CallBooked"] } } }),
    prisma.alert.count({ where: { status: "open" } }),
    prisma.client.findMany({
      include: {
        campaigns: {
          include: {
            metrics: { where: { date: { gte: monthStart } } },
          },
        },
        reports: { orderBy: { generatedAt: "desc" }, take: 1 },
      },
    }),
    prisma.metric.aggregate({
      _sum: { spend: true },
      where: { date: { gte: monthStart } },
    }),
  ]);

  // Calculate MRR from retainer tiers (simple mapping)
  const tierValues: Record<string, number> = {
    starter: 1500,
    growth: 3500,
    scale: 7000,
    enterprise: 12000,
  };

  const totalMRR = clients
    .filter((c) => c.status === "Active")
    .reduce((sum, c) => sum + (tierValues[c.retainerTier?.toLowerCase() || ""] || 0), 0);

  const clientHealth = clients.map((client) => {
    const allMetrics = client.campaigns.flatMap((c) => c.metrics);
    const totalSpend = allMetrics.reduce((s, m) => s + m.spend, 0);
    const totalRevenue = allMetrics.reduce((s, m) => s + m.revenue, 0);
    const currentRoas = totalSpend > 0 ? totalRevenue / totalSpend : null;
    const roasTarget = null; // Would come from client record
    const lastReport = client.reports[0]?.generatedAt || null;
    const daysSinceReport = lastReport
      ? Math.floor((now.getTime() - new Date(lastReport).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: client.id,
      companyName: client.companyName,
      retainerTier: client.retainerTier,
      status: client.status,
      currentRoas,
      roasTarget: client.roasTarget,
      roasDelta: currentRoas && client.roasTarget
        ? ((currentRoas - client.roasTarget) / client.roasTarget) * 100
        : null,
      lastReportDate: lastReport,
      noRecentReport: daysSinceReport !== null && daysSinceReport > 30,
      roasBelowTarget: currentRoas !== null && client.roasTarget !== null
        && currentRoas < client.roasTarget * 0.9,
    };
  });

  return NextResponse.json({
    totalClients,
    totalMRR,
    totalAdSpend: totalSpendResult._sum.spend || 0,
    openLeads,
    openAlerts,
    clientHealth,
  });
}
