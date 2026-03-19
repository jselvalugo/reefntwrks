import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { sendAdminNotification, newLeadEmail } from "@/lib/email";

// GET /api/v1/leads - Admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const sortBy = searchParams.get("sortBy") || "submittedAt";
  const order = searchParams.get("order") || "desc";

  const leads = await prisma.lead.findMany({
    where: status ? { status: status as "New" } : undefined,
    orderBy: { [sortBy]: order },
  });

  return NextResponse.json(leads);
}

// POST /api/v1/leads - Public (intake form)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, storeUrl, platform, monthlySpend, goal, priorAgency, source } = body;

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        storeUrl,
        platform,
        monthlySpend,
        goal,
        priorAgency: priorAgency === true || priorAgency === "yes",
        source,
        status: "New",
      },
    });

    // Send admin notification asynchronously
    const { subject, html } = newLeadEmail(lead);
    sendAdminNotification({ subject, html }).catch(console.error);

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
