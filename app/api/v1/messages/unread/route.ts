import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/messages/unread - Returns unread message count for current client
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role === "client") {
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!client) return NextResponse.json({ count: 0 });

    const count = await prisma.message.count({
      where: {
        clientId: client.id,
        read: false,
        sender: { role: "admin" },
      },
    });
    return NextResponse.json({ count });
  }

  // Admin: count all unread client messages
  const count = await prisma.message.count({
    where: { read: false, sender: { role: "client" } },
  });
  return NextResponse.json({ count });
}
