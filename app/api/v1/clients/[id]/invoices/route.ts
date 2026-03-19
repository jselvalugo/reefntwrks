import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id/invoices
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await checkAccess(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const invoices = await prisma.invoice.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invoices);
}

// POST /api/v1/clients/:id/invoices - Admin only
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { amount, description, dueDate } = body;

  const invoice = await prisma.invoice.create({
    data: {
      clientId: id,
      amount: Number(amount),
      description,
      dueDate: new Date(dueDate),
      status: "draft",
      history: [{ status: "draft", timestamp: new Date().toISOString() }],
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
