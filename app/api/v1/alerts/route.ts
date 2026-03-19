import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/alerts - Admin only
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const alerts = await prisma.alert.findMany({
    where: { status: "open" },
    include: {
      client: { select: { companyName: true } },
      campaign: { select: { name: true } },
    },
    orderBy: [{ currentValue: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(alerts);
}
