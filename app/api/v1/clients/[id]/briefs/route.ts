import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, briefReadyEmail } from "@/lib/email";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id/briefs
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await checkAccess(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const briefs = await prisma.brief.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(briefs);
}

// POST /api/v1/clients/:id/briefs - Admin only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, content } = body;

  const brief = await prisma.brief.create({
    data: {
      clientId: id,
      title,
      content,
      status: "awaiting_approval",
      history: [{ status: "awaiting_approval", timestamp: new Date().toISOString() }],
    },
  });

  // Notify client
  const client = await prisma.client.findUnique({
    where: { id },
    include: { user: true },
  });
  if (client?.user?.email) {
    const briefUrl = `${process.env.AUTH_URL}/portal/briefs/${brief.id}`;
    const { subject, html } = briefReadyEmail(client.user.name || client.companyName, title, briefUrl);
    sendEmail({ to: client.user.email, subject, html }).catch(console.error);
  }

  return NextResponse.json(brief, { status: 201 });
}
