import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendAdminNotification, briefApprovedEmail } from "@/lib/email";

// POST /api/v1/briefs/:id/approve - Client only (own brief)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: { client: { include: { user: true } } },
  });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership if client role
  if (session.user.role !== "admin" && brief.client.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const history = Array.isArray(brief.history) ? brief.history : [];
  const updated = await prisma.brief.update({
    where: { id },
    data: {
      status: "approved",
      history: [...history, { status: "approved", timestamp: new Date().toISOString(), by: session.user.name }],
    },
  });

  // Notify admin
  const { subject, html } = briefApprovedEmail(brief.title, brief.client.companyName);
  sendAdminNotification({ subject, html }).catch(console.error);

  return NextResponse.json(updated);
}
