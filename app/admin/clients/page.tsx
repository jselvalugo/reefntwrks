"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Client {
  id: string;
  companyName: string;
  retainerTier: string | null;
  status: string;
  websiteUrl: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
}

const statusStyles: Record<string, { bg: string; color: string; border: string }> = {
  Active: { bg: "rgba(34,197,94,0.12)", color: "#16A34A", border: "rgba(34,197,94,0.25)" },
  Onboarding: { bg: "rgba(59,130,246,0.12)", color: "#2563EB", border: "rgba(59,130,246,0.25)" },
  Paused: { bg: "rgba(245,158,11,0.12)", color: "#B45309", border: "rgba(245,158,11,0.25)" },
  Churned: { bg: "rgba(239,68,68,0.12)", color: "#DC2626", border: "rgba(239,68,68,0.25)" },
};

const RETAINER_TIERS = ["Starter — $1,500", "Growth — $3,000", "Scale — $5,000", "Enterprise — $8,000+", "Custom"];

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.Onboarding;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {status}
    </span>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    websiteUrl: "",
    retainerTier: "",
    adAccountId: "",
  });

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/v1/clients");
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function resetForm() {
    setForm({ companyName: "", contactName: "", email: "", websiteUrl: "", retainerTier: "", adAccountId: "" });
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.companyName.trim() || !form.email.trim()) {
      setError("Company name and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create client.");
        return;
      }
      setModalOpen(false);
      resetForm();
      fetchClients();
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: "1px solid var(--color-border)",
    background: "var(--color-surface)",
    color: "var(--color-text)",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s",
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Clients
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            All managed client accounts
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: "var(--color-coral)", color: "#fff" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-coral-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-coral)")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                {["Company", "Contact", "Retainer Tier", "Status", "Website", "Created"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
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
                  <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    Loading clients…
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: "var(--color-text-subtle)" }}>
                    No clients yet.{" "}
                    <button
                      className="hover:underline"
                      style={{ color: "var(--color-coral)" }}
                      onClick={() => setModalOpen(true)}
                    >
                      Add your first client →
                    </button>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                  >
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-semibold hover:underline"
                        style={{ color: "var(--color-coral)" }}
                      >
                        {client.companyName}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      <div>{client.user.name ?? "—"}</div>
                      <div className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
                        {client.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-3.5" style={{ color: "var(--color-text-muted)" }}>
                      {client.retainerTier ?? <span style={{ color: "var(--color-text-subtle)" }}>—</span>}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={client.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      {client.websiteUrl ? (
                        <a
                          href={client.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm hover:underline"
                          style={{ color: "var(--color-coral)" }}
                        >
                          {client.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      ) : (
                        <span style={{ color: "var(--color-text-subtle)" }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                      {fmtDate(client.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(15,17,23,0.5)", backdropFilter: "blur(2px)" }}
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  Add New Client
                </h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: "var(--color-text-muted)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-4">
                  {error && (
                    <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}>
                      {error}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Company Name <span style={{ color: "var(--color-coral)" }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.companyName}
                        onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                        placeholder="Acme Co."
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={form.contactName}
                        onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                        placeholder="Jane Smith"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                      Email <span style={{ color: "var(--color-coral)" }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@acme.com"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={form.websiteUrl}
                      onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                      placeholder="https://acme.com"
                      style={inputStyle}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Retainer Tier
                      </label>
                      <select
                        value={form.retainerTier}
                        onChange={(e) => setForm((f) => ({ ...f, retainerTier: e.target.value }))}
                        style={{ ...inputStyle }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      >
                        <option value="">Select tier…</option>
                        {RETAINER_TIERS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                        Ad Account ID
                      </label>
                      <input
                        type="text"
                        value={form.adAccountId}
                        onChange={(e) => setForm((f) => ({ ...f, adAccountId: e.target.value }))}
                        placeholder="act_123456"
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-coral)")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                      />
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div
                  className="flex items-center justify-end gap-3 px-6 py-4"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
                    style={{ color: "var(--color-text-muted)", background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface-2)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-surface)")}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    style={{ background: "var(--color-coral)", color: "#fff" }}
                    onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLElement).style.background = "var(--color-coral-hover)"; }}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-coral)")}
                  >
                    {submitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating…
                      </>
                    ) : (
                      "Create Client"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
