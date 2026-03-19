import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: MailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@reefntwrks.com",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Email send error:", error);
  }
}

export async function sendAdminNotification({
  subject,
  html,
}: {
  subject: string;
  html: string;
}) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;
  return sendEmail({ to: adminEmail, subject, html });
}

export function newLeadEmail(lead: {
  name?: string | null;
  email?: string | null;
  storeUrl?: string | null;
  monthlySpend?: string | null;
  goal?: string | null;
  source?: string | null;
}) {
  return {
    subject: `New Lead: ${lead.storeUrl || lead.name || "Unknown"} — $${lead.monthlySpend || "?"}/mo`,
    html: `
      <h2>New Lead Submission</h2>
      <p><strong>Name:</strong> ${lead.name || "—"}</p>
      <p><strong>Email:</strong> ${lead.email || "—"}</p>
      <p><strong>Store URL:</strong> ${lead.storeUrl || "—"}</p>
      <p><strong>Monthly Spend:</strong> $${lead.monthlySpend || "—"}</p>
      <p><strong>Primary Goal:</strong> ${lead.goal || "—"}</p>
      <p><strong>How They Found Us:</strong> ${lead.source || "—"}</p>
      <p><a href="${process.env.AUTH_URL}/admin/leads">View all leads</a></p>
    `,
  };
}

export function welcomeClientEmail(
  name: string,
  setPasswordUrl: string
) {
  return {
    subject: "Welcome to Reef Ntwrks — Set Your Password",
    html: `
      <h2>Welcome to Reef Ntwrks, ${name}!</h2>
      <p>Your client portal account has been created. Click the link below to set your password and access your portal.</p>
      <p><a href="${setPasswordUrl}">Set Your Password</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  };
}

export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Reef Ntwrks — Reset Your Password",
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  };
}

export function briefReadyEmail(clientName: string, briefTitle: string, briefUrl: string) {
  return {
    subject: `Campaign Brief Ready for Review — ${briefTitle}`,
    html: `
      <h2>Hi ${clientName},</h2>
      <p>Your campaign brief "<strong>${briefTitle}</strong>" is ready for your review and approval.</p>
      <p><a href="${briefUrl}">Review Brief</a></p>
    `,
  };
}

export function briefApprovedEmail(briefTitle: string, clientName: string) {
  return {
    subject: `Brief Approved — ${briefTitle}`,
    html: `
      <h2>Brief Approved</h2>
      <p><strong>${clientName}</strong> has approved the brief "<strong>${briefTitle}</strong>".</p>
    `,
  };
}

export function briefChangesRequestedEmail(briefTitle: string, clientName: string, feedback: string) {
  return {
    subject: `Brief Changes Requested — ${briefTitle}`,
    html: `
      <h2>Changes Requested</h2>
      <p><strong>${clientName}</strong> has requested changes to the brief "<strong>${briefTitle}</strong>".</p>
      <h3>Feedback:</h3>
      <p>${feedback}</p>
    `,
  };
}

export function newMessageEmail(clientName: string, portalUrl: string) {
  return {
    subject: `New Message from ${clientName}`,
    html: `
      <h2>New Message</h2>
      <p><strong>${clientName}</strong> has sent you a new message in the portal.</p>
      <p><a href="${portalUrl}">View Message</a></p>
    `,
  };
}

export function alertEmail(alertData: {
  clientName: string;
  campaignName: string;
  type: string;
  currentValue: number;
  priorValue?: number;
  variance?: number;
}) {
  const typeLabels: Record<string, string> = {
    roas_drop: "ROAS Drop Alert",
    high_frequency: "High Creative Frequency Alert",
    budget_overpace: "Budget Overpacing Alert",
    budget_underpace: "Budget Underpacing Alert",
  };
  return {
    subject: `Alert: ${typeLabels[alertData.type] || alertData.type} — ${alertData.clientName}`,
    html: `
      <h2>${typeLabels[alertData.type] || alertData.type}</h2>
      <p><strong>Client:</strong> ${alertData.clientName}</p>
      <p><strong>Campaign:</strong> ${alertData.campaignName}</p>
      <p><strong>Current Value:</strong> ${alertData.currentValue}</p>
      ${alertData.priorValue ? `<p><strong>Prior Value:</strong> ${alertData.priorValue}</p>` : ""}
      ${alertData.variance ? `<p><strong>Variance:</strong> ${alertData.variance.toFixed(1)}%</p>` : ""}
    `,
  };
}
