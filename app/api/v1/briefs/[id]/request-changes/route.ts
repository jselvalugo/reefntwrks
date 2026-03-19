import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendAdminNotification, briefChangesRequestedEmail } from "@/lib/email";

// POST /api/v1/briefs/:id/request-changes - Client only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { feedback } = await req.json();

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: { client: { include: { user: true } } },
  });
  if (!brief) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role !== "admin" && brief.client.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const history = Array.isArray(brief.history) ? brief.history : [];
  const updated = await prisma.brief.update({
    where: { id },
    data: {
      status: "changes_requested",
      history: [...history, { status: "changes_requested", feedback, timestamp: new Date().toISOString(), by: session.user.name }],
    },
  });

  const { subject, html } = briefChangesRequestedEmail(brief.title, brief.client.companyName, feedback || "No feedback provided");
  sendAdminNotification({ subject, html }).catch(console.error);

  return NextResponse.json(updated);
}
