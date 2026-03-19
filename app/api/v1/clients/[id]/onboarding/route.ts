import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendAdminNotification } from "@/lib/email";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// PUT /api/v1/clients/:id/onboarding - Save onboarding questionnaire
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await checkAccess(id);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { onboardingData, complete } = body;

  const updateData: Record<string, unknown> = { onboardingData };
  if (complete) {
    updateData.status = "Active";
  }

  const client = await prisma.client.update({
    where: { id },
    data: updateData,
  });

  if (complete) {
    const adminUrl = `${process.env.AUTH_URL}/admin/clients/${id}`;
    sendAdminNotification({
      subject: `Onboarding Complete — ${client.companyName}`,
      html: `<p><strong>${client.companyName}</strong> has completed their onboarding questionnaire.</p><p><a href="${adminUrl}">Review questionnaire</a></p>`,
    }).catch(console.error);
  }

  return NextResponse.json(client);
}
