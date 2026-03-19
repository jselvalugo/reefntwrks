import { prisma } from "@/lib/prisma";
import { sendAdminNotification, alertEmail } from "@/lib/email";

/**
 * Nightly job: Compare ROAS this week vs last week.
 * If drop > 15%, create an alert.
 */
export async function runRoasDropCheck() {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - 7);

  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 14);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setDate(now.getDate() - 7);

  const campaigns = await prisma.campaign.findMany({
    where: { status: "Active" },
    include: {
      client: true,
      metrics: {
        where: { date: { gte: lastWeekStart } },
        orderBy: { date: "asc" },
      },
    },
  });

  for (const campaign of campaigns) {
    const thisWeekMetrics = campaign.metrics.filter((m) => m.date >= thisWeekStart);
    const lastWeekMetrics = campaign.metrics.filter((m) => m.date >= lastWeekStart && m.date < lastWeekEnd);

    if (thisWeekMetrics.length === 0 || lastWeekMetrics.length === 0) continue;

    const thisSpend = thisWeekMetrics.reduce((s, m) => s + m.spend, 0);
    const thisRevenue = thisWeekMetrics.reduce((s, m) => s + m.revenue, 0);
    const lastSpend = lastWeekMetrics.reduce((s, m) => s + m.spend, 0);
    const lastRevenue = lastWeekMetrics.reduce((s, m) => s + m.revenue, 0);

    const thisRoas = thisSpend > 0 ? thisRevenue / thisSpend : null;
    const lastRoas = lastSpend > 0 ? lastRevenue / lastSpend : null;

    if (!thisRoas || !lastRoas || lastRoas === 0) continue;

    const drop = ((lastRoas - thisRoas) / lastRoas) * 100;

    if (drop >= 15) {
      await prisma.alert.create({
        data: {
          clientId: campaign.clientId,
          campaignId: campaign.id,
          type: "roas_drop",
          threshold: 15,
          currentValue: thisRoas,
          priorValue: lastRoas,
          status: "open",
        },
      });

      const { subject, html } = alertEmail({
        clientName: campaign.client.companyName,
        campaignName: campaign.name,
        type: "roas_drop",
        currentValue: thisRoas,
        priorValue: lastRoas,
        variance: drop,
      });
      sendAdminNotification({ subject, html }).catch(console.error);
    }
  }
}

/**
 * Run on every metrics update: check creative frequency > 4.
 * Only creates one alert per creative per threshold crossing.
 */
export async function runFrequencyCheck(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      client: true,
      creatives: { where: { status: "Active" } },
    },
  });
  if (!campaign) return;

  for (const creative of campaign.creatives) {
    if (creative.frequency > 4) {
      // Check if alert already exists and is open
      const existing = await prisma.alert.findFirst({
        where: {
          campaignId,
          type: "high_frequency",
          status: "open",
          // Use dismissNote to store creative ID
          dismissNote: creative.id,
        },
      });
      if (existing) continue;

      await prisma.alert.create({
        data: {
          clientId: campaign.clientId,
          campaignId: campaign.id,
          type: "high_frequency",
          threshold: 4,
          currentValue: creative.frequency,
          dismissNote: creative.id,
          status: "open",
        },
      });

      const { subject, html } = alertEmail({
        clientName: campaign.client.companyName,
        campaignName: campaign.name,
        type: "high_frequency",
        currentValue: creative.frequency,
      });
      sendAdminNotification({ subject, html }).catch(console.error);
    } else {
      // Auto-close if frequency dropped below threshold
      await prisma.alert.updateMany({
        where: {
          campaignId,
          type: "high_frequency",
          status: "open",
          dismissNote: creative.id,
        },
        data: { status: "closed" },
      });
    }
  }
}

/**
 * Daily job: Check budget pacing.
 * Alert if spend is >20% above or below expected.
 */
export async function runBudgetPacingCheck() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));

  const campaigns = await prisma.campaign.findMany({
    where: { status: "Active", dailyBudget: { not: null } },
    include: {
      client: true,
      metrics: { where: { date: { gte: monthStart } } },
    },
  });

  for (const campaign of campaigns) {
    if (!campaign.dailyBudget) continue;

    const expectedSpend = campaign.dailyBudget * daysElapsed;
    const actualSpend = campaign.metrics.reduce((s, m) => s + m.spend, 0);

    if (expectedSpend === 0) continue;
    const variance = ((actualSpend - expectedSpend) / expectedSpend) * 100;

    let alertType: "budget_overpace" | "budget_underpace" | null = null;
    if (variance > 20) alertType = "budget_overpace";
    else if (variance < -20) alertType = "budget_underpace";

    if (!alertType) continue;

    // Check for existing open alert
    const existing = await prisma.alert.findFirst({
      where: { campaignId: campaign.id, type: alertType, status: "open" },
    });
    if (existing) continue;

    await prisma.alert.create({
      data: {
        clientId: campaign.clientId,
        campaignId: campaign.id,
        type: alertType,
        threshold: 20,
        currentValue: actualSpend,
        priorValue: expectedSpend,
        status: "open",
      },
    });

    const { subject, html } = alertEmail({
      clientName: campaign.client.companyName,
      campaignName: campaign.name,
      type: alertType,
      currentValue: actualSpend,
      priorValue: expectedSpend,
      variance: Math.abs(variance),
    });
    sendAdminNotification({ subject, html }).catch(console.error);
  }
}
