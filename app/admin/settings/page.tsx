"use client";

import React, { useState, useEffect, useCallback } from "react";

interface PlatformSettings {
  adminEmail: string;
  roasAlertThreshold: string;
  frequencyAlertThreshold: string;
  platformName: string;
  logoUrl: string;
}

interface ProfileForm {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const inputStyle = (focused: boolean): React.CSSProperties => ({
  border: `1px solid ${focused ? "var(--color-coral)" : "var(--color-border)"}`,
  background: "var(--color-surface)",
  color: "var(--color-text)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  transition: "border-color 0.15s",
});

function FieldInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle(focused)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={type === "password" ? "new-password" : undefined}
      />
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-subtle)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileForm>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    adminEmail: "",
    roasAlertThreshold: "10",
    frequencyAlertThreshold: "3",
    platformName: "REEF NTWRKS",
    logoUrl: "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [platformSaving, setPlatformSaving] = useState(false);
  const [platformMsg, setPlatformMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingPlatform, setLoadingPlatform] = useState(true);

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/v1/settings");
    if (res.ok) {
      const data = await res.json();
      setPlatformSettings({
        adminEmail: data.adminEmail ?? "",
        roasAlertThreshold: data.roasAlertThreshold ?? "10",
        frequencyAlertThreshold: data.frequencyAlertThreshold ?? "3",
        platformName: data.platformName ?? "REEF NTWRKS",
        logoUrl: data.logoUrl ?? "",
      });
    }
    setLoadingPlatform(false);
  }, []);

  // Fetch current user profile info
  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/v1/user/profile");
    if (res.ok) {
      const data = await res.json();
      setProfile((prev) => ({ ...prev, name: data.name ?? "", email: data.email ?? "" }));
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, [fetchSettings, fetchProfile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);

    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setProfileMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (profile.newPassword && profile.newPassword.length < 8) {
      setProfileMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if ((profile.newPassword || profile.email !== "") && !profile.currentPassword) {
      setProfileMsg({ type: "error", text: "Current password is required to update email or password." });
      return;
    }

    setProfileSaving(true);
    try {
      const body: Record<string, string> = {
        name: profile.name,
        email: profile.email,
      };
      if (profile.currentPassword) body.currentPassword = profile.currentPassword;
      if (profile.newPassword) body.newPassword = profile.newPassword;

      const res = await fetch("/api/v1/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileMsg({ type: "error", text: data.error ?? "Failed to update profile." });
      } else {
        setProfileMsg({ type: "success", text: "Profile updated successfully." });
        setProfile((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePlatform(e: React.FormEvent) {
    e.preventDefault();
    setPlatformMsg(null);
    setPlatformSaving(true);
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: platformSettings.adminEmail,
          roasAlertThreshold: platformSettings.roasAlertThreshold,
          frequencyAlertThreshold: platformSettings.frequencyAlertThreshold,
          platformName: platformSettings.platformName,
          logoUrl: platformSettings.logoUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPlatformMsg({ type: "error", text: d.error ?? "Failed to save settings." });
      } else {
        setPlatformMsg({ type: "success", text: "Platform settings saved." });
      }
    } finally {
      setPlatformSaving(false);
    }
  }

  function SaveButton({ saving, label }: { saving: boolean; label: string }) {
    return (
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
        style={{ background: "var(--color-coral)", color: "#fff" }}
        onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = "var(--color-coral-hover)"; }}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-coral)")}
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : (
          label
        )}
      </button>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Manage your profile and platform configuration
        </p>
      </div>

      {/* Admin Profile */}
      <SectionCard title="Admin Profile" description="Update your name, email, and password">
        <form onSubmit={saveProfile} className="space-y-4">
          {profileMsg && (
            <div
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: profileMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: profileMsg.type === "success" ? "#16A34A" : "#DC2626",
                border: `1px solid ${profileMsg.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              {profileMsg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FieldInput
              label="Full Name"
              value={profile.name}
              onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
              placeholder="Your name"
            />
            <FieldInput
              label="Email"
              type="email"
              value={profile.email}
              onChange={(v) => setProfile((p) => ({ ...p, email: v }))}
              placeholder="admin@reefntwrks.com"
            />
          </div>

          <div
            className="pt-4 mt-4"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--color-text-muted)" }}>
              Change Password
            </p>
            <div className="space-y-4">
              <FieldInput
                label="Current Password"
                type="password"
                value={profile.currentPassword}
                onChange={(v) => setProfile((p) => ({ ...p, currentPassword: v }))}
                placeholder="Required to change email or password"
              />
              <div className="grid grid-cols-2 gap-4">
                <FieldInput
                  label="New Password"
                  type="password"
                  value={profile.newPassword}
                  onChange={(v) => setProfile((p) => ({ ...p, newPassword: v }))}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  hint="Min 8 chars, 1 uppercase, 1 number"
                />
                <FieldInput
                  label="Confirm New Password"
                  type="password"
                  value={profile.confirmPassword}
                  onChange={(v) => setProfile((p) => ({ ...p, confirmPassword: v }))}
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <SaveButton saving={profileSaving} label="Save Profile" />
          </div>
        </form>
      </SectionCard>

      {/* Platform Settings */}
      <SectionCard title="Platform Settings" description="Configure notifications and alert thresholds">
        {loadingPlatform ? (
          <p className="text-sm py-4" style={{ color: "var(--color-text-subtle)" }}>
            Loading settings…
          </p>
        ) : (
          <form onSubmit={savePlatform} className="space-y-4">
            {platformMsg && (
              <div
                className="px-3 py-2.5 rounded-lg text-sm"
                style={{
                  background: platformMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: platformMsg.type === "success" ? "#16A34A" : "#DC2626",
                  border: `1px solid ${platformMsg.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
              >
                {platformMsg.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                label="Platform Name"
                value={platformSettings.platformName}
                onChange={(v) => setPlatformSettings((p) => ({ ...p, platformName: v }))}
                placeholder="REEF NTWRKS"
              />
              <FieldInput
                label="Admin Notification Email"
                type="email"
                value={platformSettings.adminEmail}
                onChange={(v) => setPlatformSettings((p) => ({ ...p, adminEmail: v }))}
                placeholder="admin@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FieldInput
                label="ROAS Alert Threshold (%)"
                type="number"
                value={platformSettings.roasAlertThreshold}
                onChange={(v) => setPlatformSettings((p) => ({ ...p, roasAlertThreshold: v }))}
                placeholder="10"
                hint="Alert fires when ROAS drops below target by this %"
              />
              <FieldInput
                label="Frequency Alert Threshold"
                type="number"
                value={platformSettings.frequencyAlertThreshold}
                onChange={(v) => setPlatformSettings((p) => ({ ...p, frequencyAlertThreshold: v }))}
                placeholder="3"
                hint="Alert fires when ad frequency exceeds this value"
              />
            </div>

            <FieldInput
              label="Logo URL"
              type="url"
              value={platformSettings.logoUrl}
              onChange={(v) => setPlatformSettings((p) => ({ ...p, logoUrl: v }))}
              placeholder="https://cdn.example.com/logo.png"
              hint="Used in email templates and portal branding"
            />

            {platformSettings.logoUrl && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={platformSettings.logoUrl}
                  alt="Logo preview"
                  className="h-8 max-w-[120px] object-contain"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
                <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
                  Logo preview
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <SaveButton saving={platformSaving} label="Save Settings" />
            </div>
          </form>
        )}
      </SectionCard>
    </div>
  );
}
