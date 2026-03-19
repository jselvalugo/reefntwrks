/**
 * Format a number as currency
 */
export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a ROAS value (e.g. 3.45x)
 */
export function formatRoas(value: number): string {
  return `${value.toFixed(2)}x`;
}

/**
 * Format a percentage change with sign
 */
export function formatPctChange(value: number | null): string {
  if (value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get campaign status badge color
 */
export function campaignStatusVariant(status: string): "green" | "yellow" | "blue" | "gray" {
  switch (status) {
    case "Active": return "green";
    case "Paused": return "yellow";
    case "InReview": return "blue";
    case "Ended": return "gray";
    default: return "gray";
  }
}

/**
 * Get brief status badge color
 */
export function briefStatusVariant(status: string): "green" | "yellow" | "gray" | "coral" {
  switch (status) {
    case "approved": return "green";
    case "awaiting_approval": return "yellow";
    case "changes_requested": return "coral";
    case "draft": return "gray";
    default: return "gray";
  }
}

/**
 * Format date as "Mar 15, 2026"
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format date range for display
 */
export function formatDateRange(start: string | Date, end: string | Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}

/**
 * Compute aggregated metrics from an array of metric rows
 */
export function aggregateMetrics(metrics: Array<{
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  purchases: number;
}>) {
  const spend = metrics.reduce((s, m) => s + m.spend, 0);
  const revenue = metrics.reduce((s, m) => s + m.revenue, 0);
  const clicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const impressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const purchases = metrics.reduce((s, m) => s + m.purchases, 0);

  return {
    spend,
    revenue,
    clicks,
    impressions,
    purchases,
    roas: spend > 0 ? revenue / spend : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    cpp: purchases > 0 ? spend / purchases : 0,
  };
}

export function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
