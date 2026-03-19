import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id/campaigns
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await checkAccess(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { clientId: id },
    include: {
      metrics: { orderBy: { date: "desc" }, take: 30 },
      creatives: true,
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  return NextResponse.json(campaigns);
}

// POST /api/v1/clients/:id/campaigns - Admin only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, objective, status, dailyBudget, startDate, endDate } = body;

  const campaign = await prisma.campaign.create({
    data: {
      clientId: id,
      name,
      objective,
      status: status || "Active",
      dailyBudget: dailyBudget ? Number(dailyBudget) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(campaign, { status: 201 });
}
