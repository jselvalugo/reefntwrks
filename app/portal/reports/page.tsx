import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function ReportTypeBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    weekly: { bg: "rgba(59,130,246,0.12)", color: "#2563eb", label: "Weekly" },
    monthly: { bg: "rgba(34,197,94,0.12)", color: "#16a34a", label: "Monthly" },
    qbr: { bg: "rgba(168,85,247,0.12)", color: "#7c3aed", label: "QBR" },
  };
  const s = map[type] || map.monthly;
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export default async function ReportsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
    include: {
      reports: { orderBy: { generatedAt: "desc" } },
    },
  });

  if (!client) redirect("/portal/dashboard");

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Your performance report library</p>
      </div>

      {client.reports.length === 0 ? (
        <div className="card-surface rounded-2xl p-12 text-center">
          <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No reports yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>Your first report will appear here once it's generated.</p>
        </div>
      ) : (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {["Report", "Type", "Period", "Generated", ""].map((h, i) => (
                    <th key={i} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {client.reports.map((report, i) => (
                  <tr
                    key={report.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderTop: i > 0 ? "1px solid var(--color-border)" : undefined }}
                  >
                    <td className="px-5 py-4 font-medium" style={{ color: "var(--color-text)" }}>{report.name}</td>
                    <td className="px-5 py-4">
                      <ReportTypeBadge type={report.type} />
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>
                      {fmt(report.periodStart)} – {fmt(report.periodEnd)}
                    </td>
                    <td className="px-5 py-4" style={{ color: "var(--color-text-muted)" }}>{fmt(report.generatedAt)}</td>
                    <td className="px-5 py-4">
                      {report.url ? (
                        <a
                          href={report.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                          style={{ background: "var(--color-coral-muted)", color: "var(--color-coral)", border: "1px solid rgba(255,107,71,0.3)" }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
