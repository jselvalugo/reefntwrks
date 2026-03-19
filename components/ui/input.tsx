import React, { forwardRef } from "react";

// ── Shared label + wrapper ─────────────────────────────────────────────────

interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label}
          {required && (
            <span className="ml-0.5" style={{ color: "var(--color-coral)" }} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-danger)" }} role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

// ── Base input styles ──────────────────────────────────────────────────────

const baseInputStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
  borderRadius: "var(--radius-md)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
  width: "100%",
};

const errorInputStyle: React.CSSProperties = {
  ...baseInputStyle,
  borderColor: "var(--color-danger)",
};

function handleFocus(e: React.FocusEvent<HTMLElement>, hasError?: boolean) {
  if (!hasError) {
    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-coral)";
    (e.currentTarget as HTMLElement).style.boxShadow =
      "0 0 0 3px rgba(255,107,71,0.12)";
  }
}

function handleBlur(e: React.FocusEvent<HTMLElement>, hasError?: boolean) {
  (e.currentTarget as HTMLElement).style.borderColor = hasError
    ? "var(--color-danger)"
    : "var(--color-border)";
  (e.currentTarget as HTMLElement).style.boxShadow = "none";
}

// ── Input ──────────────────────────────────────────────────────────────────

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  error?: boolean;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      error = false,
      leftAddon,
      rightAddon,
      inputSize = "md",
      className = "",
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const sizeClass =
      inputSize === "sm"
        ? "px-3 py-1.5 text-xs"
        : inputSize === "lg"
        ? "px-4 py-3 text-base"
        : "px-3.5 py-2.5 text-sm";

    if (leftAddon || rightAddon) {
      return (
        <div
          className="flex items-center rounded-lg overflow-hidden"
          style={{ border: `1px solid ${error ? "var(--color-danger)" : "var(--color-border)"}`, background: "white" }}
        >
          {leftAddon && (
            <div
              className="flex items-center px-3 text-sm flex-shrink-0"
              style={{
                borderRight: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                background: "var(--color-surface)",
                alignSelf: "stretch",
              }}
            >
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            className={`flex-1 outline-none bg-transparent placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
            style={{ color: "var(--color-text)", border: "none" }}
            onFocus={(e) => {
              (e.currentTarget.closest("div") as HTMLDivElement).style.borderColor =
                "var(--color-coral)";
              (e.currentTarget.closest("div") as HTMLDivElement).style.boxShadow =
                "0 0 0 3px rgba(255,107,71,0.12)";
              onFocus?.(e);
            }}
            onBlur={(e) => {
              (e.currentTarget.closest("div") as HTMLDivElement).style.borderColor = error
                ? "var(--color-danger)"
                : "var(--color-border)";
              (e.currentTarget.closest("div") as HTMLDivElement).style.boxShadow = "none";
              onBlur?.(e);
            }}
            {...props}
          />
          {rightAddon && (
            <div
              className="flex items-center px-3 text-sm flex-shrink-0"
              style={{
                borderLeft: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                background: "var(--color-surface)",
                alignSelf: "stretch",
              }}
            >
              {rightAddon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        ref={ref}
        className={`outline-none placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${className}`}
        style={error ? errorInputStyle : baseInputStyle}
        onFocus={(e) => {
          handleFocus(e, error);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handleBlur(e, error);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// ── Textarea ───────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, resize = "vertical", className = "", onFocus, onBlur, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`px-3.5 py-2.5 text-sm outline-none placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed min-h-[100px] ${className}`}
        style={{
          ...(error ? errorInputStyle : baseInputStyle),
          resize,
        }}
        onFocus={(e) => {
          handleFocus(e, error);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          handleBlur(e, error);
          onBlur?.(e);
        }}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

// ── Select ─────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, placeholder, children, className = "", onFocus, onBlur, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full px-3.5 py-2.5 text-sm outline-none appearance-none pr-9 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          style={error ? errorInputStyle : baseInputStyle}
          onFocus={(e) => {
            handleFocus(e, error);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            handleBlur(e, error);
            onBlur?.(e);
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {/* Chevron icon */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"
          style={{ color: "var(--color-text-muted)" }}
          aria-hidden="true"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

// ── Checkbox ───────────────────────────────────────────────────────────────

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", id, ...props }, ref) => {
    return (
      <label htmlFor={id} className={`flex items-center gap-2.5 cursor-pointer group ${className}`}>
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="w-4 h-4 rounded border cursor-pointer"
          style={{
            accentColor: "var(--color-coral)",
            borderColor: "var(--color-border)",
          }}
          {...props}
        />
        {label && (
          <span className="text-sm" style={{ color: "var(--color-text)" }}>
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

// ── Search Input (convenience) ─────────────────────────────────────────────

interface SearchInputProps extends Omit<InputProps, "leftAddon"> {
  placeholder?: string;
}

export function SearchInput({ placeholder = "Search…", ...props }: SearchInputProps) {
  return (
    <Input
      type="search"
      placeholder={placeholder}
      leftAddon={
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      {...props}
    />
  );
}

export default Input;
