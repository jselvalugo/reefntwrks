import React from "react";

type BadgeVariant = "green" | "yellow" | "red" | "blue" | "gray" | "coral" | "teal";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#16A34A",
    border: "1px solid rgba(34, 197, 94, 0.25)",
  },
  yellow: {
    background: "rgba(245, 158, 11, 0.12)",
    color: "#B45309",
    border: "1px solid rgba(245, 158, 11, 0.25)",
  },
  red: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#DC2626",
    border: "1px solid rgba(239, 68, 68, 0.25)",
  },
  blue: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#2563EB",
    border: "1px solid rgba(59, 130, 246, 0.25)",
  },
  gray: {
    background: "rgba(107, 114, 128, 0.1)",
    color: "#4B5563",
    border: "1px solid rgba(107, 114, 128, 0.2)",
  },
  coral: {
    background: "rgba(255, 107, 71, 0.12)",
    color: "#E8562C",
    border: "1px solid rgba(255, 107, 71, 0.25)",
  },
  teal: {
    background: "rgba(45, 212, 191, 0.12)",
    color: "#0F9689",
    border: "1px solid rgba(45, 212, 191, 0.25)",
  },
};

const dotColors: Record<BadgeVariant, string> = {
  green: "#16A34A",
  yellow: "#B45309",
  red: "#DC2626",
  blue: "#2563EB",
  gray: "#4B5563",
  coral: "#E8562C",
  teal: "#0F9689",
};

export function Badge({
  variant = "gray",
  size = "md",
  children,
  className = "",
  dot = false,
}: BadgeProps) {
  const sizeClasses = size === "sm" ? "text-xs px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses} ${className}`}
      style={variantStyles[variant]}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: dotColors[variant] }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// Convenience exports for common status patterns
export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "green", label: "Active" },
    paused: { variant: "yellow", label: "Paused" },
    inactive: { variant: "gray", label: "Inactive" },
    pending: { variant: "blue", label: "Pending" },
    cancelled: { variant: "red", label: "Cancelled" },
    completed: { variant: "teal", label: "Completed" },
    draft: { variant: "gray", label: "Draft" },
    live: { variant: "green", label: "Live" },
    error: { variant: "red", label: "Error" },
    new: { variant: "coral", label: "New" },
  };

  const config = map[status.toLowerCase()] ?? { variant: "gray" as BadgeVariant, label: status };

  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}

export default Badge;
