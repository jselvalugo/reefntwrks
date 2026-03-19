import React from "react";

type Trend = "up" | "down" | "neutral";

interface MetricCardProps {
  label: string;
  value: string | number;
  /** Formatted change string, e.g. "+12.4%" or "-3.1%" */
  change?: string;
  /** Numeric change value used to determine color coding when changeDir is not provided */
  changeValue?: number;
  /** Override automatic direction detection */
  changeDir?: Trend;
  /** Whether "up" is good (green) or bad (red). Defaults to true (up = good). */
  upIsGood?: boolean;
  /** Sub-label below the change, e.g. "vs. last 30 days" */
  period?: string;
  /** Icon or emoji to display in the card header */
  icon?: React.ReactNode;
  /** Accent color for the icon background. Defaults to coral. */
  iconColor?: string;
  /** Optional chart or sparkline to display at the bottom */
  chart?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

function TrendArrow({ direction }: { direction: Trend }) {
  if (direction === "neutral") {
    return (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14" />
      </svg>
    );
  }
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ transform: direction === "down" ? "rotate(180deg)" : undefined }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );
}

function getTrend(changeValue?: number, changeDir?: Trend): Trend {
  if (changeDir) return changeDir;
  if (changeValue === undefined || changeValue === 0) return "neutral";
  return changeValue > 0 ? "up" : "down";
}

function getChangeColor(trend: Trend, upIsGood: boolean): string {
  if (trend === "neutral") return "var(--color-text-muted)";
  if (trend === "up") return upIsGood ? "var(--color-success)" : "var(--color-danger)";
  return upIsGood ? "var(--color-danger)" : "var(--color-success)";
}

function getChangeBg(trend: Trend, upIsGood: boolean): string {
  if (trend === "neutral") return "rgba(107,114,128,0.08)";
  if (trend === "up")
    return upIsGood ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)";
  return upIsGood ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";
}

export function MetricCard({
  label,
  value,
  change,
  changeValue,
  changeDir,
  upIsGood = true,
  period = "vs. prior period",
  icon,
  iconColor = "var(--color-coral)",
  chart,
  loading = false,
  className = "",
  onClick,
}: MetricCardProps) {
  const trend = getTrend(changeValue, changeDir);
  const changeColor = getChangeColor(trend, upIsGood);
  const changeBg = getChangeBg(trend, upIsGood);
  const isClickable = !!onClick;

  if (loading) {
    return (
      <div
        className={`rounded-xl p-5 bg-white ${className}`}
        style={{ border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        {/* Skeleton */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-3.5 w-24 rounded animate-pulse"
            style={{ background: "var(--color-surface-2)" }}
          />
          <div
            className="w-9 h-9 rounded-lg animate-pulse"
            style={{ background: "var(--color-surface-2)" }}
          />
        </div>
        <div
          className="h-8 w-32 rounded animate-pulse mb-2"
          style={{ background: "var(--color-surface-2)" }}
        />
        <div
          className="h-3 w-20 rounded animate-pulse"
          style={{ background: "var(--color-surface-2)" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-5 bg-white flex flex-col gap-3 transition-all duration-150 ${isClickable ? "cursor-pointer" : ""} ${className}`}
      style={{ border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      onMouseEnter={(e) => {
        if (isClickable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (isClickable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }
      }}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between gap-3">
        <span
          className="text-sm font-medium leading-tight"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
        {icon && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
            style={{ background: iconColor, opacity: 0.9 }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div
        className="text-3xl font-bold tracking-tight leading-none"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </div>

      {/* Change badge + period */}
      {change !== undefined && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: changeColor, background: changeBg }}
          >
            <TrendArrow direction={trend} />
            {change}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
            {period}
          </span>
        </div>
      )}

      {/* Optional chart */}
      {chart && (
        <div className="mt-1 -mx-1">
          {chart}
        </div>
      )}
    </div>
  );
}

// ── Metric Grid layout helper ──────────────────────────────────────────────

export function MetricGrid({
  children,
  columns = 4,
  className = "",
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colClass: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };

  return (
    <div className={`grid gap-4 ${colClass[columns]} ${className}`}>
      {children}
    </div>
  );
}

export default MetricCard;
