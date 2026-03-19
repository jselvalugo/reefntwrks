import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendEmail, welcomeClientEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { companyName, retainerTier } = body;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Create user + client + password reset link
  const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 12);

  const user = await prisma.user.create({
    data: {
      email: lead.email || "",
      name: lead.name || "",
      role: "client",
      passwordHash: tempHash,
      client: {
        create: {
          companyName: companyName || lead.storeUrl || "New Client",
          websiteUrl: lead.storeUrl,
          retainerTier: retainerTier || "starter",
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

  // Update lead status
  await prisma.lead.update({
    where: { id },
    data: { status: "Converted", clientId: user.client!.id },
  });

  // Send welcome email
  const setPasswordUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;
  if (lead.email) {
    const { subject, html } = welcomeClientEmail(lead.name || "there", setPasswordUrl);
    sendEmail({ to: lead.email, subject, html }).catch(console.error);
  }

  return NextResponse.json({ userId: user.id, clientId: user.client!.id });
}
