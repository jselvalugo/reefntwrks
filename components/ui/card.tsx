import React from "react";

// ── Card Root ──────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Remove the default padding from the card body */
  noPadding?: boolean;
  /** Hoverable card with subtle lift effect */
  hoverable?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  style,
  noPadding = false,
  hoverable = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={[
        "rounded-xl bg-white",
        "border transition-all duration-150",
        hoverable ? "cursor-pointer" : "",
        !noPadding ? "p-6" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        ...(hoverable
          ? {}
          : {}),
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        }
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

// ── Card Header ────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between gap-4 ${className}`}
      style={subtitle ? { marginBottom: "1.25rem" } : { marginBottom: "1rem" }}
    >
      <div className="min-w-0">
        {typeof title === "string" ? (
          <h3
            className="text-base font-semibold leading-tight truncate"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h3>
        ) : (
          title
        )}
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ── Card Divider ───────────────────────────────────────────────────────────

export function CardDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`-mx-6 my-4 ${className}`}
      style={{ height: "1px", background: "var(--color-border)" }}
    />
  );
}

// ── Card Footer ────────────────────────────────────────────────────────────

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
  /** Push to the right edge of card */
  align?: "left" | "right" | "between";
}

export function CardFooter({ children, className = "", align = "right" }: CardFooterProps) {
  const alignClass =
    align === "right"
      ? "justify-end"
      : align === "between"
      ? "justify-between"
      : "justify-start";

  return (
    <div
      className={`-mx-6 -mb-6 px-6 py-4 mt-4 flex items-center gap-3 rounded-b-xl ${alignClass} ${className}`}
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {children}
    </div>
  );
}

// ── Dark Card (for sidebar / navy background contexts) ─────────────────────

export function DarkCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{
        background: "var(--color-navy-light)",
        border: "1px solid var(--color-navy-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
