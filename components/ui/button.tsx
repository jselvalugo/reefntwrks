import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  outline: "btn-outline",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-sm gap-2",
};

function Spinner() {
  return (
    <svg
      className="animate-spin w-4 h-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyle: React.CSSProperties = (() => {
    switch (variant) {
      case "primary":
        return {
          background: "var(--color-coral)",
          color: "white",
          border: "1px solid transparent",
        };
      case "secondary":
        return {
          background: "var(--color-navy)",
          color: "white",
          border: "1px solid var(--color-navy-border)",
        };
      case "outline":
        return {
          background: "transparent",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
        };
      case "danger":
        return {
          background: "rgba(239,68,68,0.1)",
          color: "#DC2626",
          border: "1px solid rgba(239,68,68,0.25)",
        };
      case "ghost":
        return {
          background: "transparent",
          color: "var(--color-text-muted)",
          border: "1px solid transparent",
        };
    }
  })();

  return (
    <button
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center font-medium rounded-lg",
        "transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget;
        switch (variant) {
          case "primary":
            el.style.background = "var(--color-coral-hover)";
            break;
          case "secondary":
            el.style.borderColor = "var(--color-coral)";
            break;
          case "outline":
            el.style.borderColor = "var(--color-navy)";
            el.style.background = "rgba(15,17,23,0.04)";
            break;
          case "danger":
            el.style.background = "rgba(239,68,68,0.18)";
            break;
          case "ghost":
            el.style.background = "rgba(15,17,23,0.06)";
            el.style.color = "var(--color-text)";
            break;
        }
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        const el = e.currentTarget;
        Object.assign(el.style, baseStyle);
        props.onMouseLeave?.(e);
      }}
      {...props}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// Link-styled button variant
interface LinkButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export function LinkButton({ children, className = "", ...props }: LinkButtonProps) {
  return (
    <button
      className={`text-sm font-medium transition-colors duration-150 hover:opacity-80 ${className}`}
      style={{ color: "var(--color-coral)" }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
