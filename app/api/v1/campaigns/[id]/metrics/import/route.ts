import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Papa from "papaparse";

interface MetricRow {
  date: string;
  spend: string;
  impressions: string;
  clicks: string;
  purchases: string;
  revenue: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const text = await file.text();
  const result = Papa.parse<MetricRow>(text, { header: true, skipEmptyLines: true });

  if (result.errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: result.errors }, { status: 400 });
  }

  const rows = result.data;
  const errors: string[] = [];
  const metrics = [];

  for (const row of rows) {
    if (!row.date) {
      errors.push(`Missing date in row: ${JSON.stringify(row)}`);
      continue;
    }

    const spend = Number(row.spend) || 0;
    const revenue = Number(row.revenue) || 0;
    const clicks = Number(row.clicks) || 0;
    const impressions = Number(row.impressions) || 0;
    const purchases = Number(row.purchases) || 0;

    metrics.push({
      campaignId: id,
      date: new Date(row.date),
      spend,
      impressions,
      clicks,
      purchases,
      revenue,
      roas: spend > 0 ? revenue / spend : null,
      cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
      cpp: purchases > 0 ? spend / purchases : null,
    });
  }

  // Upsert all metrics
  const created = await Promise.all(
    metrics.map((m) =>
      prisma.metric.upsert({
        where: { campaignId_date: { campaignId: id, date: m.date } },
        update: { spend: m.spend, impressions: m.impressions, clicks: m.clicks, purchases: m.purchases, revenue: m.revenue, roas: m.roas, cpm: m.cpm, ctr: m.ctr, cpp: m.cpp },
        create: m,
      })
    )
  );

  return NextResponse.json({ imported: created.length, errors });
}
