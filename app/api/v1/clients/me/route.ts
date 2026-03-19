import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/v1/clients/me - Returns the client record for the logged-in user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      campaigns: {
        include: {
          metrics: { orderBy: { date: "desc" }, take: 30 },
          creatives: true,
        },
      },
      briefs: { orderBy: { createdAt: "desc" } },
      reports: { orderBy: { generatedAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  return NextResponse.json(client);
}
