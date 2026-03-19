import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, welcomeClientEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// GET /api/v1/clients - Admin only
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clients = await prisma.client.findMany({
    include: {
      user: { select: { email: true, name: true } },
      campaigns: {
        include: {
          metrics: { orderBy: { date: "desc" }, take: 30 },
        },
      },
      reports: { orderBy: { generatedAt: "desc" }, take: 1 },
      invoices: { where: { status: { in: ["sent", "overdue"] } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

// POST /api/v1/clients - Admin only
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { companyName, contactName, email, websiteUrl, retainerTier, adAccountId } = body;

  if (!email || !companyName)
    return NextResponse.json({ error: "Company name and email are required" }, { status: 400 });

  // Create temp password
  const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12);

  const user = await prisma.user.create({
    data: {
      email,
      name: contactName,
      role: "client",
      passwordHash: tempHash,
      client: {
        create: {
          companyName,
          websiteUrl,
          retainerTier,
          adAccountId,
          status: "Onboarding",
        },
      },
    },
    include: { client: true },
  });

  // Create set-password token (24h expiry)
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordReset.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const setPasswordUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
  const { subject, html } = welcomeClientEmail(contactName || companyName, setPasswordUrl);
  sendEmail({ to: email, subject, html }).catch(console.error);

  return NextResponse.json({ userId: user.id, clientId: user.client!.id }, { status: 201 });
}
