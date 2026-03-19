import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

function BriefStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: "rgba(107,114,128,0.12)", color: "#6b7280", label: "Draft" },
    awaiting_approval: { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Awaiting Approval" },
    approved: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Approved" },
    changes_requested: { bg: "rgba(255,107,71,0.12)", color: "#FF6B47", label: "Changes Requested" },
  };
  const s = map[status] || map.draft;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default async function BriefsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      briefs: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!client) redirect("/portal/dashboard");

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Campaign Briefs</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Review and approve campaign strategy from your media buying team</p>
      </div>

      {client.briefs.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No briefs yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>Campaign briefs will appear here when your team creates them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {client.briefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/portal/briefs/${brief.id}`}
              className="card-surface flex items-center justify-between p-5 rounded-2xl hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-surface-2)" }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-muted)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{brief.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Updated {fmt(brief.updatedAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <BriefStatusBadge status={brief.status} />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
