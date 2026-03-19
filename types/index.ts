// Shared TypeScript types for the platform

export interface ClientHealthRow {
  id: string;
  companyName: string;
  retainerTier: string | null;
  status: string;
  currentRoas: number | null;
  roasTarget: number | null;
  roasDelta: number | null;
  lastReportDate: string | null;
  noRecentReport: boolean;
  roasBelowTarget: boolean;
}

export interface DashboardMetrics {
  spend: number;
  spendChange: number | null;
  revenue: number;
  revenueChange: number | null;
  roas: number;
  roasChange: number | null;
  activeCampaigns: number;
}

export interface OnboardingChecklist {
  accountCreated: boolean;
  questionnaireComplete: boolean;
  adAccountConnected: boolean;
  briefApproved: boolean;
  firstCampaignLive: boolean;
}

export type LeadStatus = "New" | "Contacted" | "CallBooked" | "Qualified" | "Converted" | "Lost";
export type BriefStatus = "draft" | "awaiting_approval" | "approved" | "changes_requested";
export type CampaignStatus = "Active" | "Paused" | "InReview" | "Ended";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";
export type AlertType = "roas_drop" | "high_frequency" | "budget_overpace" | "budget_underpace";
