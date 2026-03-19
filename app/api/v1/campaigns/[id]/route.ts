import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkCampaignAccess(campaignId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { client: { select: { userId: true } } },
  });
  if (campaign?.client.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/campaigns/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await checkCampaignAccess(id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      metrics: {
        where: {
          date: {
            gte: startDate ? new Date(startDate) : undefined,
            lte: endDate ? new Date(endDate) : undefined,
          },
        },
        orderBy: { date: "asc" },
      },
      creatives: { where: { status: "Active" } },
    },
  });

  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

// PUT /api/v1/campaigns/:id - Admin only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, objective, status, dailyBudget, startDate, endDate } = body;

  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      name,
      objective,
      status,
      dailyBudget: dailyBudget ? Number(dailyBudget) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  });

  return NextResponse.json(campaign);
}
