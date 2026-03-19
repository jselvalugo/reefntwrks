import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/briefs/:id - Admin or own client
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: { client: { select: { userId: true, companyName: true } } },
  });

  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && brief.client.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(brief);
}

// PUT /api/v1/briefs/:id - Admin only (draft or changes_requested status)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, content } = body;

  const existing = await prisma.brief.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["draft", "changes_requested"].includes(existing.status)) {
    return NextResponse.json({ error: "Cannot edit an approved brief" }, { status: 400 });
  }

  const brief = await prisma.brief.update({
    where: { id },
    data: { title, content },
  });

  return NextResponse.json(brief);
}
