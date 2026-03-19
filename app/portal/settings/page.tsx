"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Preferences {
  weeklyReportEmail: boolean;
  newMessageAlert: boolean;
}

export default function PortalSettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [prefs, setPrefs] = useState<Preferences>({ weeklyReportEmail: true, newMessageAlert: true });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/v1/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, preferences: prefs }),
    });
    if (res.ok) {
      await update({ name });
      setMessage({ type: "success", text: "Settings saved." });
    } else {
      const d = await res.json();
      setMessage({ type: "error", text: d.error || "Failed to save." });
    }
    setSaving(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Update your profile and notification preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <div className="card-surface rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Profile</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text)" }}>Email Address</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-3 rounded-xl text-sm cursor-not-allowed"
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            />
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-subtle)" }}>Email cannot be changed here.</p>
          </div>
        </div>

        {/* Notification preferences */}
        <div className="card-surface rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>Notification Preferences</h2>

          {[
            { key: "weeklyReportEmail" as const, label: "Weekly report emails", desc: "Get an email notification when a new report is available" },
            { key: "newMessageAlert" as const, label: "New message alerts", desc: "Get an email when your Reef Ntwrks team sends a message" },
          ].map((pref) => (
            <div key={pref.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{pref.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{pref.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                className="w-11 h-6 rounded-full relative flex-shrink-0 transition-all focus:outline-none"
                style={{
                  background: prefs[pref.key] ? "var(--color-coral)" : "var(--color-surface-2)",
                  border: `1px solid ${prefs[pref.key] ? "var(--color-coral)" : "var(--color-border)"}`,
                }}
                role="switch"
                aria-checked={prefs[pref.key]}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                  style={{ transform: prefs[pref.key] ? "translateX(1.375rem)" : "translateX(0.125rem)" }}
                />
              </button>
            </div>
          ))}
        </div>

        {message && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              background: message.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: message.type === "success" ? "var(--color-success)" : "var(--color-danger)",
            }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {message.type === "success"
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              }
            </svg>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
          style={{ background: "var(--color-coral)" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
