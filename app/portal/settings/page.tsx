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
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Update your profile and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div
          className="p-6 rounded-xl space-y-5"
          style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-sm font-semibold text-white">Profile</h2>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm text-white bg-transparent"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={session?.user?.email || ""}
              disabled
              className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-500 bg-transparent cursor-not-allowed"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
        </div>

        <div
          className="p-6 rounded-xl space-y-4"
          style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h2 className="text-sm font-semibold text-white">Notification Preferences</h2>

          {[
            { key: "weeklyReportEmail" as const, label: "Weekly report emails", desc: "Receive an email when a new report is available" },
            { key: "newMessageAlert" as const, label: "New message notifications", desc: "Receive an email when the team sends a new message" },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm text-white">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.desc}</p>
              </div>
              <div
                onClick={() => setPrefs((p) => ({ ...p, [pref.key]: !p[pref.key] }))}
                className="w-10 h-5 rounded-full relative flex-shrink-0 transition-colors"
                style={{ background: prefs[pref.key] ? "#FF6B47" : "rgba(107,114,128,0.4)" }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm"
                  style={{ transform: prefs[pref.key] ? "translateX(1.25rem)" : "translateX(0.125rem)" }}
                />
              </div>
            </label>
          ))}
        </div>

        {message && (
          <p
            className="text-sm px-4 py-3 rounded-lg"
            style={{
              background: message.type === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
              color: message.type === "success" ? "#16a34a" : "#ef4444",
            }}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "#FF6B47", color: "white" }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
