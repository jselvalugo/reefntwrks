import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await checkAccess(id);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true } },
      campaigns: { orderBy: { createdAt: "desc" } },
      reports: { orderBy: { generatedAt: "desc" } },
      briefs: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

// PUT /api/v1/clients/:id - Admin only
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { companyName, adAccountId, retainerTier, status, roasTarget, websiteUrl } = body;

  const client = await prisma.client.update({
    where: { id },
    data: { companyName, adAccountId, retainerTier, status, roasTarget, websiteUrl },
  });

  return NextResponse.json(client);
}
