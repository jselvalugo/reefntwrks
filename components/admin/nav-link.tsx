"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminNavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function AdminNavLink({ href, label, icon }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
      style={
        isActive
          ? {
              background: "var(--color-coral-muted)",
              color: "var(--color-coral)",
              borderLeft: "2px solid var(--color-coral)",
              paddingLeft: "calc(0.75rem - 2px)",
            }
          : {
              color: "#8B93A7",
              borderLeft: "2px solid transparent",
              paddingLeft: "calc(0.75rem - 2px)",
            }
      }
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "#C9D1E0";
          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLAnchorElement).style.color = "#8B93A7";
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        }
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </Link>
  );
}
