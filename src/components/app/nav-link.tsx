"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children, exact = false, muted = false }: { href: string; children: ReactNode; exact?: boolean; muted?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors focus-ring ${active ? "bg-gold/15 text-gold-soft" : muted ? "text-platinum/60 hover:bg-white/5 hover:text-ivory" : "text-platinum/80 hover:bg-white/5 hover:text-ivory"}`}>
      {children}
    </Link>
  );
}
