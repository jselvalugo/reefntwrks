import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function checkAccess(clientId: string) {
  const session = await auth();
  if (!session) return null;
  if (session.user.role === "admin") return session;
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (client?.userId !== session.user.id) return null;
  return session;
}

// GET /api/v1/clients/:id/reports
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await checkAccess(id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const reports = await prisma.report.findMany({
    where: { clientId: id },
    orderBy: { generatedAt: "desc" },
  });

  return NextResponse.json(reports);
}

// POST /api/v1/clients/:id/reports - Admin only (file upload)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const formData = await req.formData();

  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const periodStart = formData.get("periodStart") as string;
  const periodEnd = formData.get("periodEnd") as string;
  const file = formData.get("file") as File | null;

  let url: string | null = null;

  if (file) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "reports");
    await mkdir(uploadDir, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await writeFile(path.join(uploadDir, filename), buffer);
    url = `/uploads/reports/${filename}`;
  }

  const report = await prisma.report.create({
    data: {
      clientId: id,
      name,
      type: type as "weekly" | "monthly" | "qbr",
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      url,
    },
  });

  return NextResponse.json(report, { status: 201 });
}
