import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendAdminNotification, newMessageEmail } from "@/lib/email";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id/messages
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await checkAccess(id);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { clientId: id },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });

  // Mark messages as read for the current user's perspective
  if (session.user.role === "admin") {
    // Admin reading — mark client messages as read
    await prisma.message.updateMany({
      where: { clientId: id, read: false, sender: { role: "client" } },
      data: { read: true },
    });
  } else {
    // Client reading — mark admin messages as read
    await prisma.message.updateMany({
      where: { clientId: id, read: false, sender: { role: "admin" } },
      data: { read: true },
    });
  }

  return NextResponse.json(messages);
}

// POST /api/v1/clients/:id/messages
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await checkAccess(id);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  const message = await prisma.message.create({
    data: { clientId: id, senderId: session.user.id, body: body.trim() },
    include: { sender: { select: { name: true, role: true } } },
  });

  // Notify admin if client sent the message
  if (session.user.role === "client") {
    const client = await prisma.client.findUnique({ where: { id }, select: { companyName: true } });
    const portalUrl = `${process.env.AUTH_URL}/admin/clients/${id}/messages`;
    const { subject, html } = newMessageEmail(client?.companyName || "Client", portalUrl);
    sendAdminNotification({ subject, html }).catch(console.error);
  }

  return NextResponse.json(message, { status: 201 });
}
