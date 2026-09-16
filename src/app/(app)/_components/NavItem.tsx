"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavItem({
  href,
  label,
  icon,
  count,
  danger,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  count?: number;
  danger?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={`nav-item${active ? " active" : ""}`}>
      {icon}
      {label}
      {typeof count === "number" && (
        <span className={`nav-badge${danger ? " nav-badge-red" : ""}`}>{count}</span>
      )}
    </Link>
  );
}
