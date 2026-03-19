import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return null;
  return session;
}

// PUT /api/v1/leads/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin())
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const lead = await prisma.lead.update({
    where: { id },
    data: { status, notes },
  });

  return NextResponse.json(lead);
}
