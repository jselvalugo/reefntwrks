"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface PortalNavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function PortalNavLink({ href, label, icon, badge }: PortalNavLinkProps) {
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
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight"
          style={{
            background: "var(--color-coral)",
            color: "white",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
