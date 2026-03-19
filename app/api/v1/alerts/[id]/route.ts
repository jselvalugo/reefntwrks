import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PUT /api/v1/alerts/:id - Admin only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { status, dismissNote } = await req.json();

  const alert = await prisma.alert.update({
    where: { id },
    data: { status, dismissNote },
  });

  return NextResponse.json(alert);
}
