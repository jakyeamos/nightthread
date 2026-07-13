import { Orbit } from "lucide-react";

export function Brand({ compact = false, tone = "default" }: { compact?: boolean; tone?: "default" | "light" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em] ${tone === "light" ? "text-white" : "text-[var(--ink)]"}`}>
      <span className={`grid size-8 place-items-center rounded-full ${tone === "light" ? "bg-white/16 text-white" : "bg-[var(--thread-soft)] text-[var(--thread)]"}`}><Orbit size={17} /></span>
      {!compact && "Nightthread"}
    </span>
  );
}
