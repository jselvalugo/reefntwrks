import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/v1/campaigns/:id/metrics
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { date, spend, impressions, clicks, purchases, revenue } = body;

  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  const spendNum = Number(spend) || 0;
  const revenueNum = Number(revenue) || 0;
  const clicksNum = Number(clicks) || 0;
  const impressionsNum = Number(impressions) || 0;
  const purchasesNum = Number(purchases) || 0;

  const roas = spendNum > 0 ? revenueNum / spendNum : null;
  const cpm = impressionsNum > 0 ? (spendNum / impressionsNum) * 1000 : null;
  const ctr = impressionsNum > 0 ? (clicksNum / impressionsNum) * 100 : null;
  const cpp = purchasesNum > 0 ? spendNum / purchasesNum : null;

  const metric = await prisma.metric.upsert({
    where: { campaignId_date: { campaignId: id, date: new Date(date) } },
    update: { spend: spendNum, impressions: impressionsNum, clicks: clicksNum, purchases: purchasesNum, revenue: revenueNum, roas, cpm, ctr, cpp },
    create: { campaignId: id, date: new Date(date), spend: spendNum, impressions: impressionsNum, clicks: clicksNum, purchases: purchasesNum, revenue: revenueNum, roas, cpm, ctr, cpp },
  });

  return NextResponse.json(metric);
}

// DELETE /api/v1/campaigns/:id/metrics?date=YYYY-MM-DD
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = req.nextUrl;
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });

  await prisma.metric.deleteMany({
    where: { campaignId: id, date: new Date(date) },
  });

  return NextResponse.json({ message: "Deleted" });
}
