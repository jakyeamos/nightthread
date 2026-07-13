"use client";

import { Activity, CalendarDays, Lightbulb, Map, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "@/components/brand";
import type { TripRole } from "@/domain/types";

const links = [
  ["Overview", "", Map],
  ["Planner", "/planner", CalendarDays],
  ["Saved ideas", "/ideas", Lightbulb],
  ["Activity", "/activity", Activity],
] as const;

export function TripShell({ tripId, tripName, memberCount, role, children }: { tripId: string; tripName: string; memberCount: number; role: TripRole; children: ReactNode }) {
  const pathname = usePathname();
  const root = `/trips/${tripId}`;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-[var(--line)] bg-[var(--surface)] px-5 md:px-7">
        <Link href="/trips"><Brand /></Link>
        <span className="mx-5 hidden h-5 w-px bg-[var(--line)] md:block" />
        <Link href={root} className="hidden items-center gap-2 text-sm font-medium md:flex"><span className="size-2 rounded-full bg-[var(--thread)]" />{tripName}</Link>
        <nav aria-label="Trip navigation" className="ml-auto flex h-full items-center gap-1">
          {links.map(([label, suffix, Icon]) => {
            const href = `${root}${suffix}`;
            const selected = suffix === "" ? pathname === root : pathname.startsWith(href);
            return <Link key={label} href={href} aria-current={selected ? "page" : undefined} className={`flex h-10 items-center gap-2 rounded-lg px-3 text-sm transition-colors ${selected ? "bg-[var(--indigo-soft)] text-[var(--indigo-hover)]" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"}`}><Icon size={16} /><span className="hidden lg:inline">{label}</span></Link>;
          })}
          <span className="mx-1 h-5 w-px bg-[var(--line)]" />
          <Link href={role === "owner" ? `${root}/settings#collaboration` : `${root}/activity`} aria-label={`${memberCount} trip member${memberCount === 1 ? "" : "s"}`} className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"><Users size={17} /><span>{memberCount}</span></Link>
          {role === "owner" && <Link aria-label="Trip settings" href={`${root}/settings`} className="grid size-9 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"><Settings size={17} /></Link>}
        </nav>
      </header>
      {children}
    </div>
  );
}
