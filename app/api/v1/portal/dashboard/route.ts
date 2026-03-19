import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/portal/dashboard?range=month|7|30|custom&start=&end=
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      campaigns: {
        include: {
          creatives: true,
        },
      },
      briefs: { where: { status: "approved" }, take: 1 },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const range = searchParams.get("range") || "month";
  const now = new Date();

  let startDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  if (range === "7") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    prevStartDate = new Date(now);
    prevStartDate.setDate(now.getDate() - 14);
    prevEndDate = startDate;
  } else if (range === "30") {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);
    prevStartDate = new Date(now);
    prevStartDate.setDate(now.getDate() - 60);
    prevEndDate = startDate;
  } else {
    // current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    prevEndDate = startDate;
  }

  const campaignIds = client.campaigns.map((c) => c.id);

  const [currentMetrics, prevMetrics] = await Promise.all([
    prisma.metric.findMany({
      where: { campaignId: { in: campaignIds }, date: { gte: startDate } },
    }),
    prisma.metric.findMany({
      where: { campaignId: { in: campaignIds }, date: { gte: prevStartDate, lt: prevEndDate } },
    }),
  ]);

  function aggregate(metrics: typeof currentMetrics) {
    const spend = metrics.reduce((s, m) => s + m.spend, 0);
    const revenue = metrics.reduce((s, m) => s + m.revenue, 0);
    const roas = spend > 0 ? revenue / spend : 0;
    return { spend, revenue, roas };
  }

  const current = aggregate(currentMetrics);
  const prev = aggregate(prevMetrics);

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  }

  // Find top performing creative by ROAS
  const allCreatives = client.campaigns.flatMap((c) => c.creatives);
  const topCreative = allCreatives.sort((a, b) => (b.roas || 0) - (a.roas || 0))[0];

  const activeCampaigns = client.campaigns.filter((c) => c.status === "Active").length;

  // Onboarding checklist status
  const hasApprovedBrief = client.briefs.length > 0;
  const hasActiveCampaign = activeCampaigns > 0;

  return NextResponse.json({
    client: {
      id: client.id,
      companyName: client.companyName,
      status: client.status,
      roasTarget: client.roasTarget,
    },
    metrics: {
      spend: current.spend,
      spendChange: pctChange(current.spend, prev.spend),
      revenue: current.revenue,
      revenueChange: pctChange(current.revenue, prev.revenue),
      roas: current.roas,
      roasChange: pctChange(current.roas, prev.roas),
      activeCampaigns,
    },
    topCreative,
    onboardingChecklist: {
      accountCreated: true,
      questionnaireComplete: !!client.onboardingData,
      adAccountConnected: !!client.adAccountId,
      briefApproved: hasApprovedBrief,
      firstCampaignLive: hasActiveCampaign,
    },
  });
}
