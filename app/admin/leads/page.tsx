"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

const STATUS_OPTIONS = ["New", "Contacted", "CallBooked", "Qualified", "Converted", "Lost"] as const;
type LeadStatus = (typeof STATUS_OPTIONS)[number];

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  storeUrl: string | null;
  monthlySpend: string | null;
  goal: string | null;
  source: string | null;
  platform: string | null;
  priorAgency: boolean | null;
  status: LeadStatus;
  notes: string | null;
  submittedAt: string;
}

const statusVariant: Record<LeadStatus, { bg: string; color: string; border: string }> = {
  New: { bg: "rgba(255,107,71,0.12)", color: "#E8562C", border: "rgba(255,107,71,0.25)" },
  Contacted: { bg: "rgba(59,130,246,0.12)", color: "#2563EB", border: "rgba(59,130,246,0.25)" },
  CallBooked: { bg: "rgba(45,212,191,0.12)", color: "#0F9689", border: "rgba(45,212,191,0.25)" },
  Qualified: { bg: "rgba(168,85,247,0.12)", color: "#7C3AED", border: "rgba(168,85,247,0.25)" },
  Converted: { bg: "rgba(34,197,94,0.12)", color: "#16A34A", border: "rgba(34,197,94,0.25)" },
  Lost: { bg: "rgba(107,114,128,0.1)", color: "#4B5563", border: "rgba(107,114,128,0.2)" },
};

function StatusBadge({ status }: { status: LeadStatus }) {
  const v = statusVariant[status] ?? statusVariant.New;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: v.bg, color: v.color, border: `1px solid ${v.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: v.color }} />
      {status}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [converting, setConverting] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    const url = filterStatus === "all" ? "/api/v1/leads" : `/api/v1/leads?status=${filterStatus}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setLeads(data);
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchLeads();
  }, [fetchLeads]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function openDrawer(lead: Lead) {
    setSelectedLead(lead);
    setNotesValue(lead.notes ?? "");
    setDrawerOpen(true);
  }

  async function updateStatus(leadId: string, newStatus: string) {
    setSavingStatus(leadId);
    try {
      const res = await fetch(`/api/v1/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: updated.status } : l)));
        if (selectedLead?.id === leadId) {
          setSelectedLead((prev) => (prev ? { ...prev, status: updated.status } : prev));
        }
      }
    } finally {
      setSavingStatus(null);
    }
  }

  async function saveNotes() {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: updated.notes } : l)));
        setSelectedLead((prev) => (prev ? { ...prev, notes: updated.notes } : prev));
      }
    } finally {
      setSavingNotes(false);
    }
  }

  async function convertToClient() {
    if (!selectedLead) return;
    setConverting(true);
    try {
      const res = await fetch(`/api/v1/leads/${selectedLead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? { ...l, status: "Converted" } : l)));
        setSelectedLead((prev) => (prev ? { ...prev, status: "Converted" } : prev));
        alert(`Converted! Client ID: ${data.clientId}`);
      } else {
        const err = await res.json();
        alert(err.error ?? "Conversion failed");
      }
    } finally {
      setConverting(false);
    }
  }

  const displayedLeads = leads; // already filtered server-side

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Leads
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Manage and qualify your inbound pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium sr-only" htmlFor="status-filter">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg border outline-none transition-all"
            style={{
              background: "#fff",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                {["Name", "Email", "Store URL", "Spend Range", "Goal", "Source", "Submitted", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    Loading leads…
                  </td>
                </tr>
              ) : displayedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    No leads found for this filter.
                  </td>
                </tr>
              ) : (
                displayedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    onClick={() => openDrawer(lead)}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                  >
                    <td className="px-4 py-3.5 font-medium" style={{ color: "var(--color-text)" }}>
                      {lead.name ?? <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      {lead.email ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {lead.storeUrl ? (
                        <a
                          href={lead.storeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                          style={{ color: "var(--color-coral)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.storeUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      {lead.monthlySpend ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 max-w-[160px] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {lead.goal ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 capitalize" style={{ color: "var(--color-text-muted)" }}>
                      {lead.source ?? "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                      {fmtDate(lead.submittedAt)}
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        disabled={savingStatus === lead.id}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border outline-none transition-all"
                        style={{
                          background: statusVariant[lead.status]?.bg ?? "transparent",
                          color: statusVariant[lead.status]?.color ?? "inherit",
                          border: `1px solid ${statusVariant[lead.status]?.border ?? "transparent"}`,
                          fontWeight: 500,
                          cursor: savingStatus === lead.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} style={{ background: "#fff", color: "#0F1117" }}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        className="text-xs font-medium hover:underline"
                        style={{ color: "var(--color-coral)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(lead);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over drawer */}
      {drawerOpen && selectedLead && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 transition-opacity"
            style={{ background: "rgba(15,17,23,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <aside
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-lg flex flex-col shadow-xl overflow-y-auto"
            style={{ background: "#fff", borderLeft: "1px solid var(--color-border)" }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  {selectedLead.name ?? "Unnamed Lead"}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  Submitted {fmtDate(selectedLead.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg transition-all"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                aria-label="Close drawer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-6">
              {/* Status selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--color-text-muted)" }}>
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      disabled={savingStatus === selectedLead.id}
                      onClick={() => updateStatus(selectedLead.id, s)}
                      className="transition-all"
                      style={{
                        padding: "4px 12px",
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 500,
                        border: `1px solid ${
                          selectedLead.status === s ? statusVariant[s]?.border : "var(--color-border)"
                        }`,
                        background: selectedLead.status === s ? statusVariant[s]?.bg : "transparent",
                        color: selectedLead.status === s ? statusVariant[s]?.color : "var(--color-text-muted)",
                        cursor: savingStatus === selectedLead.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead details */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-3 block" style={{ color: "var(--color-text-muted)" }}>
                  Lead Details
                </label>
                <dl className="space-y-2.5">
                  {[
                    { label: "Email", value: selectedLead.email },
                    { label: "Store URL", value: selectedLead.storeUrl },
                    { label: "Platform", value: selectedLead.platform },
                    { label: "Monthly Spend", value: selectedLead.monthlySpend },
                    { label: "Goal", value: selectedLead.goal },
                    { label: "Source", value: selectedLead.source },
                    { label: "Prior Agency", value: selectedLead.priorAgency === true ? "Yes" : selectedLead.priorAgency === false ? "No" : null },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3">
                      <dt className="text-xs font-medium w-32 flex-shrink-0 pt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {label}
                      </dt>
                      <dd className="text-sm flex-1" style={{ color: "var(--color-text)" }}>
                        {value ?? <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Internal Notes */}
              <div>
                <label
                  htmlFor="lead-notes"
                  className="text-xs font-semibold uppercase tracking-wide mb-2 block"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Internal Notes
                </label>
                <textarea
                  id="lead-notes"
                  rows={4}
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add private notes about this lead…"
                  className="w-full text-sm px-3 py-2.5 rounded-lg border resize-none outline-none transition-all"
                  style={{
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                  onFocus={(e) => (e.currentTarget.style.border = "1px solid var(--color-coral)")}
                  onBlur={(e) => (e.currentTarget.style.border = "1px solid var(--color-border)")}
                />
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="mt-2 px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  style={{
                    background: "var(--color-coral)",
                    color: "#fff",
                    cursor: savingNotes ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!savingNotes) (e.currentTarget as HTMLElement).style.background = "var(--color-coral-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-coral)";
                  }}
                >
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
              </div>
            </div>

            {/* Drawer footer */}
            <div
              className="px-6 py-4 flex-shrink-0 flex items-center justify-between gap-3"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
                Current status: <StatusBadge status={selectedLead.status} />
              </span>
              {selectedLead.status !== "Converted" && selectedLead.status !== "Lost" && (
                <button
                  onClick={convertToClient}
                  disabled={converting}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{
                    background: "var(--color-coral)",
                    color: "#fff",
                    cursor: converting ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!converting) (e.currentTarget as HTMLElement).style.background = "var(--color-coral-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-coral)";
                  }}
                >
                  {converting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Converting…
                    </>
                  ) : (
                    "Convert to Client"
                  )}
                </button>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
