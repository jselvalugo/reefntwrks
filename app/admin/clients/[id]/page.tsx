"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

type Tab = "overview" | "campaigns" | "briefs" | "reports" | "invoices" | "messages";

interface Client {
  id: string;
  companyName: string;
  websiteUrl: string | null;
  adAccountId: string | null;
  retainerTier: string | null;
  roasTarget: number | null;
  status: string;
  user: { email: string; name: string | null };
  campaigns: Campaign[];
  briefs: Brief[];
  reports: Report[];
  invoices: Invoice[];
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number | null;
  startDate: string | null;
}

interface Brief {
  id: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Report {
  id: string;
  name: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  url: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  description: string | null;
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { name: string | null; role: string };
}

function StatusBadge({ status, type = "client" }: { status: string; type?: string }) {
  const campaignMap: Record<string, { bg: string; color: string }> = {
    Active: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
    Paused: { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
    InReview: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    Ended: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
  };
  const briefMap: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
    awaiting_approval: { bg: "rgba(245,158,11,0.12)", color: "#b45309" },
    approved: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
    changes_requested: { bg: "rgba(255,107,71,0.12)", color: "#FF6B47" },
  };
  const invoiceMap: Record<string, { bg: string; color: string }> = {
    draft: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
    sent: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
    paid: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
    overdue: { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  };
  const map = type === "campaign" ? campaignMap : type === "brief" ? briefMap : type === "invoice" ? invoiceMap : campaignMap;
  const s = map[status] || { bg: "rgba(107,114,128,0.12)", color: "#6b7280" };
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const fmt = (d?: string | Date) =>
  d ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d)) : "—";

export default function AdminClientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [editForm, setEditForm] = useState({ companyName: "", adAccountId: "", retainerTier: "", status: "", roasTarget: "", websiteUrl: "" });
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", objective: "", status: "Active", dailyBudget: "" });
  const [showBriefForm, setShowBriefForm] = useState(false);
  const [briefForm, setBriefForm] = useState({ title: "", objective: "Conversions", targetAudience: "", dailyBudget: "", totalBudget: "", adFormats: [] as string[], creativeDirection: "", roasTarget: "", cpp: "", ctr: "" });
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ amount: "", description: "", dueDate: "" });
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ name: "", type: "monthly", periodStart: "", periodEnd: "" });
  const [newMsg, setNewMsg] = useState("");

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/v1/clients/${id}`);
    if (res.ok) {
      const d = await res.json();
      setClient(d);
      setEditForm({
        companyName: d.companyName,
        adAccountId: d.adAccountId || "",
        retainerTier: d.retainerTier || "",
        status: d.status,
        roasTarget: d.roasTarget?.toString() || "",
        websiteUrl: d.websiteUrl || "",
      });
    }
    setLoading(false);
  }, [id]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/v1/clients/${id}/messages`);
    if (res.ok) setMessages(await res.json());
  }, [id]);

  useEffect(() => { fetchClient(); }, [fetchClient]);
  useEffect(() => { if (tab === "messages") fetchMessages(); }, [tab, fetchMessages]);

  async function saveClientInfo() {
    setSaving(true);
    const res = await fetch(`/api/v1/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, roasTarget: editForm.roasTarget ? Number(editForm.roasTarget) : null }),
    });
    if (res.ok) { setSuccess("Saved."); setTimeout(() => setSuccess(null), 2000); }
    setSaving(false);
  }

  async function addCampaign() {
    const res = await fetch(`/api/v1/clients/${id}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campaignForm),
    });
    if (res.ok) { setShowCampaignForm(false); fetchClient(); }
  }

  async function addBrief() {
    const content = {
      campaignName: briefForm.title,
      objective: briefForm.objective,
      targetAudience: briefForm.targetAudience,
      dailyBudget: Number(briefForm.dailyBudget),
      totalBudget: Number(briefForm.totalBudget),
      adFormats: briefForm.adFormats,
      creativeDirection: briefForm.creativeDirection,
      kpiTargets: { roas: Number(briefForm.roasTarget), cpp: Number(briefForm.cpp), ctr: Number(briefForm.ctr) },
    };
    const res = await fetch(`/api/v1/clients/${id}/briefs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: briefForm.title, content }),
    });
    if (res.ok) { setShowBriefForm(false); fetchClient(); }
  }

  async function addInvoice() {
    const res = await fetch(`/api/v1/clients/${id}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceForm),
    });
    if (res.ok) { setShowInvoiceForm(false); fetchClient(); }
  }

  async function uploadReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch(`/api/v1/clients/${id}/reports`, { method: "POST", body: formData });
    if (res.ok) { setShowReportForm(false); fetchClient(); }
  }

  async function updateInvoiceStatus(invoiceId: string, status: string) {
    await fetch(`/api/v1/invoices/${invoiceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchClient();
  }

  async function sendMessage() {
    if (!newMsg.trim()) return;
    const res = await fetch(`/api/v1/clients/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMsg }),
    });
    if (res.ok) { setNewMsg(""); fetchMessages(); }
  }

  if (loading) return <div className="text-gray-400 p-8">Loading…</div>;
  if (!client) return <div className="text-red-400 p-8">Client not found.</div>;

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "campaigns", label: `Campaigns (${client.campaigns.length})` },
    { key: "briefs", label: `Briefs (${client.briefs.length})` },
    { key: "reports", label: `Reports (${client.reports.length})` },
    { key: "invoices", label: `Invoices (${client.invoices.length})` },
    { key: "messages", label: "Messages" },
  ];

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white bg-transparent";
  const inputStyle = { border: "1px solid rgba(255,255,255,0.15)" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-gray-300 mb-1">← All Clients</button>
          <h1 className="text-2xl font-bold text-white">{client.companyName}</h1>
          <p className="text-sm text-gray-400">{client.user.email}</p>
        </div>
        <a
          href={`/portal/dashboard`}
          target="_blank"
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 border transition-colors hover:text-white"
          style={{ borderColor: "rgba(255,255,255,0.15)" }}
        >
          View as Client ↗
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#1a1f2e" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={tab === t.key ? { background: "#FF6B47", color: "white" } : { color: "#9ca3af" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="rounded-xl p-6 space-y-5" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h2 className="text-sm font-semibold text-white">Client Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Company Name", key: "companyName" },
              { label: "Website URL", key: "websiteUrl" },
              { label: "Ad Account ID", key: "adAccountId" },
              { label: "ROAS Target", key: "roasTarget" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={editForm[f.key as keyof typeof editForm]}
                  onChange={(e) => setEditForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Retainer Tier</label>
              <select value={editForm.retainerTier} onChange={(e) => setEditForm((p) => ({ ...p, retainerTier: e.target.value }))} className={inputClass} style={{ ...inputStyle, background: "#0f1117" }}>
                {["starter", "growth", "scale", "enterprise"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className={inputClass} style={{ ...inputStyle, background: "#0f1117" }}>
                {["Onboarding", "Active", "Paused", "Churned"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {success && <p className="text-sm text-green-400">{success}</p>}
          <button onClick={saveClientInfo} disabled={saving} className="px-5 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#FF6B47", color: "white" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Campaigns */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCampaignForm(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>+ Add Campaign</button>
          </div>
          {showCampaignForm && (
            <div className="p-5 rounded-xl space-y-4" style={{ background: "#1a1f2e", border: "1px solid rgba(255,107,71,0.3)" }}>
              <h3 className="text-sm font-semibold text-white">New Campaign</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Campaign Name" value={campaignForm.name} onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))} className={inputClass} style={inputStyle} />
                <input placeholder="Objective (e.g. Conversions)" value={campaignForm.objective} onChange={(e) => setCampaignForm((p) => ({ ...p, objective: e.target.value }))} className={inputClass} style={inputStyle} />
                <input placeholder="Daily Budget" value={campaignForm.dailyBudget} onChange={(e) => setCampaignForm((p) => ({ ...p, dailyBudget: e.target.value }))} className={inputClass} style={inputStyle} />
                <select value={campaignForm.status} onChange={(e) => setCampaignForm((p) => ({ ...p, status: e.target.value }))} className={inputClass} style={{ ...inputStyle, background: "#0f1117" }}>
                  {["Active", "Paused", "InReview"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addCampaign} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>Create</button>
                <button onClick={() => setShowCampaignForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400">Cancel</button>
              </div>
            </div>
          )}
          <table className="w-full text-sm rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <thead style={{ background: "#1a1f2e" }}>
              <tr>{["Name", "Status", "Daily Budget", "Start Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium" style={{ color: "#6b7280" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody style={{ background: "#0f1117" }}>
              {client.campaigns.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3 text-white">{c.name}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} type="campaign" /></td>
                  <td className="px-4 py-3 text-gray-400">{c.dailyBudget ? `$${c.dailyBudget.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(c.startDate || undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Briefs */}
      {tab === "briefs" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBriefForm(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>+ Create Brief</button>
          </div>
          {showBriefForm && (
            <div className="p-5 rounded-xl space-y-4" style={{ background: "#1a1f2e", border: "1px solid rgba(255,107,71,0.3)" }}>
              <h3 className="text-sm font-semibold text-white">Brief Builder</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input placeholder="Campaign Title" value={briefForm.title} onChange={(e) => setBriefForm((p) => ({ ...p, title: e.target.value }))} className={`${inputClass} sm:col-span-2`} style={inputStyle} />
                <select value={briefForm.objective} onChange={(e) => setBriefForm((p) => ({ ...p, objective: e.target.value }))} className={inputClass} style={{ ...inputStyle, background: "#0f1117" }}>
                  {["Conversions", "Traffic", "Awareness", "Reach", "Lead Generation"].map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <input placeholder="Daily Budget ($)" value={briefForm.dailyBudget} onChange={(e) => setBriefForm((p) => ({ ...p, dailyBudget: e.target.value }))} className={inputClass} style={inputStyle} />
                <input placeholder="Total Budget ($)" value={briefForm.totalBudget} onChange={(e) => setBriefForm((p) => ({ ...p, totalBudget: e.target.value }))} className={inputClass} style={inputStyle} />
                <textarea placeholder="Target Audience" rows={2} value={briefForm.targetAudience} onChange={(e) => setBriefForm((p) => ({ ...p, targetAudience: e.target.value }))} className={`${inputClass} sm:col-span-2 resize-none`} style={inputStyle} />
                <textarea placeholder="Creative Direction" rows={3} value={briefForm.creativeDirection} onChange={(e) => setBriefForm((p) => ({ ...p, creativeDirection: e.target.value }))} className={`${inputClass} sm:col-span-2 resize-none`} style={inputStyle} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Ad Formats</p>
                <div className="flex gap-3">
                  {["image", "video", "carousel"].map((f) => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={briefForm.adFormats.includes(f)} onChange={(e) => setBriefForm((p) => ({ ...p, adFormats: e.target.checked ? [...p.adFormats, f] : p.adFormats.filter((x) => x !== f) }))} />
                      <span className="text-sm text-gray-300 capitalize">{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="ROAS Target" value={briefForm.roasTarget} onChange={(e) => setBriefForm((p) => ({ ...p, roasTarget: e.target.value }))} className={inputClass} style={inputStyle} />
                <input placeholder="CPP Target ($)" value={briefForm.cpp} onChange={(e) => setBriefForm((p) => ({ ...p, cpp: e.target.value }))} className={inputClass} style={inputStyle} />
                <input placeholder="CTR Target (%)" value={briefForm.ctr} onChange={(e) => setBriefForm((p) => ({ ...p, ctr: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div className="flex gap-2">
                <button onClick={addBrief} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>Send to Client</button>
                <button onClick={() => setShowBriefForm(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {client.briefs.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <p className="text-sm text-white">{b.title}</p>
                  <p className="text-xs text-gray-500">{fmt(b.createdAt)}</p>
                </div>
                <StatusBadge status={b.status} type="brief" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowReportForm(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>+ Upload Report</button>
          </div>
          {showReportForm && (
            <form onSubmit={uploadReport} className="p-5 rounded-xl space-y-3" style={{ background: "#1a1f2e", border: "1px solid rgba(255,107,71,0.3)" }}>
              <input name="name" placeholder="Report Name" required className={inputClass} style={inputStyle} />
              <select name="type" className={inputClass} style={{ ...inputStyle, background: "#0f1117" }}>
                {["weekly", "monthly", "qbr"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input name="periodStart" type="date" required className={inputClass} style={inputStyle} />
                <input name="periodEnd" type="date" required className={inputClass} style={inputStyle} />
              </div>
              <input name="file" type="file" accept=".pdf,.docx" className="text-sm text-gray-400" />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>Upload</button>
                <button type="button" onClick={() => setShowReportForm(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              </div>
            </form>
          )}
          <table className="w-full text-sm rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <thead style={{ background: "#1a1f2e" }}>
              <tr>{["Name", "Type", "Period", "Date", ""].map((h, i) => <th key={i} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium" style={{ color: "#6b7280" }}>{h}</th>)}</tr>
            </thead>
            <tbody style={{ background: "#0f1117" }}>
              {client.reports.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3 text-white">{r.name}</td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{r.type}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(r.periodStart)} – {fmt(r.periodEnd)}</td>
                  <td className="px-4 py-3 text-gray-400">{fmt(r.generatedAt)}</td>
                  <td className="px-4 py-3">{r.url && <a href={r.url} target="_blank" className="text-xs text-orange-400 hover:text-orange-300">Download</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowInvoiceForm(true)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>+ Create Invoice</button>
          </div>
          {showInvoiceForm && (
            <div className="p-5 rounded-xl space-y-3" style={{ background: "#1a1f2e", border: "1px solid rgba(255,107,71,0.3)" }}>
              <input placeholder="Amount ($)" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((p) => ({ ...p, amount: e.target.value }))} className={inputClass} style={inputStyle} />
              <input placeholder="Description" value={invoiceForm.description} onChange={(e) => setInvoiceForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} style={inputStyle} />
              <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm((p) => ({ ...p, dueDate: e.target.value }))} className={inputClass} style={inputStyle} />
              <div className="flex gap-2">
                <button onClick={addInvoice} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>Create</button>
                <button onClick={() => setShowInvoiceForm(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
              </div>
            </div>
          )}
          <table className="w-full text-sm rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            <thead style={{ background: "#1a1f2e" }}>
              <tr>{["Amount", "Description", "Status", "Due Date", ""].map((h, i) => <th key={i} className="px-4 py-3 text-left text-xs uppercase tracking-wider font-medium" style={{ color: "#6b7280" }}>{h}</th>)}</tr>
            </thead>
            <tbody style={{ background: "#0f1117" }}>
              {client.invoices.map((inv) => (
                <tr key={inv.id} className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <td className="px-4 py-3 text-white font-medium">${inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{inv.description || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={inv.status} type="invoice" /></td>
                  <td className="px-4 py-3 text-gray-400">{fmt(inv.dueDate)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={inv.status}
                      onChange={(e) => updateInvoiceStatus(inv.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded bg-transparent text-gray-300"
                      style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      {["draft", "sent", "paid", "overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Messages */}
      {tab === "messages" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 space-y-4 max-h-96 overflow-y-auto" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}>
            {messages.length === 0 && <p className="text-center text-gray-500 py-4">No messages yet.</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender.role === "admin" ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: msg.sender.role === "admin" ? "#FF6B47" : "#2dd4bf" }}>
                  {msg.sender.name?.charAt(0) || "?"}
                </div>
                <div className={`px-3 py-2 rounded-xl text-sm max-w-xs ${msg.sender.role === "admin" ? "rounded-tr-sm" : "rounded-tl-sm"}`} style={{ background: msg.sender.role === "admin" ? "#FF6B47" : "rgba(255,255,255,0.08)", color: "white" }}>
                  {msg.body}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Send a message…" className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white bg-transparent" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.15)" }} />
            <button onClick={sendMessage} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: "#FF6B47", color: "white" }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}
