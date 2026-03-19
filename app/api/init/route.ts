import { NextResponse } from "next/server";
import { initScheduler } from "@/lib/jobs/scheduler";

// This route initializes the scheduler. Call it on app start.
// In production, use a dedicated worker process.
let started = false;

export async function GET() {
  if (!started) {
    initScheduler();
    started = true;
  }
  return NextResponse.json({ status: "ok" });
}
