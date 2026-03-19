import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { runFrequencyCheck } from "@/lib/jobs/alert-engine";

// GET /api/v1/campaigns/:id/creatives
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const creatives = await prisma.creative.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(creatives);
}

// POST /api/v1/campaigns/:id/creatives - Admin only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, type, url, frequency, ctr, roas } = body;

  const creative = await prisma.creative.create({
    data: {
      campaignId: id,
      name,
      type,
      url,
      frequency: Number(frequency) || 0,
      ctr: ctr ? Number(ctr) : null,
      roas: roas ? Number(roas) : null,
    },
  });

  // Check frequency alerts
  await runFrequencyCheck(id).catch(console.error);

  return NextResponse.json(creative, { status: 201 });
}
