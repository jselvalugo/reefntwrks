import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "david@reefntwrks.com" },
    update: {},
    create: {
      email: "david@reefntwrks.com",
      name: "David Selva",
      role: "admin",
      passwordHash: adminHash,
    },
  });
  console.log("Admin user created:", admin.email);

  // Create demo client
  const clientHash = await bcrypt.hash("Client123!", 12);
  const clientUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Jane Smith",
      role: "client",
      passwordHash: clientHash,
      client: {
        create: {
          companyName: "Demo Store Co.",
          websiteUrl: "https://demostore.com",
          retainerTier: "growth",
          adAccountId: "act_123456789",
          roasTarget: 3.5,
          status: "Active",
        },
      },
    },
    include: { client: true },
  });
  console.log("Demo client created:", clientUser.email);

  const client = clientUser.client!;

  // Create demo campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: "demo-campaign-1" },
    update: {},
    create: {
      id: "demo-campaign-1",
      clientId: client.id,
      name: "Summer Sale 2026 — Prospecting",
      objective: "Conversions",
      status: "Active",
      dailyBudget: 500,
      startDate: new Date("2026-03-01"),
    },
  });
  console.log("Demo campaign created:", campaign.name);

  // Seed 30 days of metrics
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const spend = 400 + Math.random() * 200;
    const revenue = spend * (2.8 + Math.random() * 1.5);
    const clicks = Math.floor(300 + Math.random() * 200);
    const impressions = Math.floor(clicks * (80 + Math.random() * 40));
    const purchases = Math.floor(clicks * (0.02 + Math.random() * 0.03));

    await prisma.metric.upsert({
      where: { campaignId_date: { campaignId: campaign.id, date } },
      update: {},
      create: {
        campaignId: campaign.id,
        date,
        spend,
        revenue,
        clicks,
        impressions,
        purchases,
        roas: revenue / spend,
        ctr: (clicks / impressions) * 100,
        cpm: (spend / impressions) * 1000,
        cpp: purchases > 0 ? spend / purchases : null,
      },
    });
  }
  console.log("30 days of metrics seeded.");

  // Seed demo creative
  await prisma.creative.upsert({
    where: { id: "demo-creative-1" },
    update: {},
    create: {
      id: "demo-creative-1",
      campaignId: campaign.id,
      name: "Summer Hero Video",
      type: "video",
      frequency: 2.3,
      ctr: 1.8,
      roas: 4.1,
      status: "Active",
    },
  });

  await prisma.creative.upsert({
    where: { id: "demo-creative-2" },
    update: {},
    create: {
      id: "demo-creative-2",
      campaignId: campaign.id,
      name: "Product Carousel — Top 5",
      type: "carousel",
      frequency: 4.7,
      ctr: 1.2,
      roas: 2.9,
      status: "Active",
    },
  });

  // Seed a brief
  await prisma.brief.upsert({
    where: { id: "demo-brief-1" },
    update: {},
    create: {
      id: "demo-brief-1",
      clientId: client.id,
      title: "Q2 Growth Campaign Brief",
      status: "awaiting_approval",
      content: {
        campaignName: "Q2 Growth Campaign",
        objective: "Conversions",
        targetAudience: "Women 25-45, interested in fashion & lifestyle, US & Canada",
        dailyBudget: 500,
        totalBudget: 15000,
        adFormats: ["video", "carousel"],
        creativeDirection: "Aspirational lifestyle imagery showing the product in real-world use cases. Focus on emotional benefits rather than features.",
        kpiTargets: { roas: 3.5, cpp: 45, ctr: 1.5 },
      },
      history: [{ status: "awaiting_approval", timestamp: new Date().toISOString() }],
    },
  });

  // Seed a report
  await prisma.report.upsert({
    where: { id: "demo-report-1" },
    update: {},
    create: {
      id: "demo-report-1",
      clientId: client.id,
      name: "March 2026 Monthly Report",
      type: "monthly",
      periodStart: new Date("2026-03-01"),
      periodEnd: new Date("2026-03-31"),
    },
  });

  // Seed an invoice
  await prisma.invoice.upsert({
    where: { id: "demo-invoice-1" },
    update: {},
    create: {
      id: "demo-invoice-1",
      clientId: client.id,
      amount: 3500,
      description: "Reef Ntwrks Growth Retainer — March 2026",
      dueDate: new Date("2026-03-15"),
      status: "paid",
      paidAt: new Date("2026-03-10"),
      history: [
        { status: "draft", timestamp: new Date("2026-03-01").toISOString() },
        { status: "sent", timestamp: new Date("2026-03-02").toISOString() },
        { status: "paid", timestamp: new Date("2026-03-10").toISOString() },
      ],
    },
  });

  // Seed a demo lead
  await prisma.lead.upsert({
    where: { id: "demo-lead-1" },
    update: {},
    create: {
      id: "demo-lead-1",
      name: "Alex Johnson",
      email: "alex@brandexample.com",
      storeUrl: "brandexample.com",
      platform: "Shopify",
      monthlySpend: "$5K-$20K",
      goal: "ROAS",
      priorAgency: true,
      source: "Instagram Ad",
      status: "New",
    },
  });

  // Seed platform settings
  const defaultSettings = [
    { key: "adminNotifyEmail", value: "david@reefntwrks.com" },
    { key: "roasAlertThreshold", value: "15" },
    { key: "frequencyAlertThreshold", value: "4" },
    { key: "platformName", value: "Reef Ntwrks" },
    { key: "logoUrl", value: "" },
  ];

  for (const setting of defaultSettings) {
    await prisma.settings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
