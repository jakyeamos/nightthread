import { Orbit } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em]">
      <span className="grid size-8 place-items-center rounded-full bg-[var(--yarn-soft)] text-[var(--yarn)]"><Orbit size={17} /></span>
      {!compact && "Nightthread"}
    </span>
  );
}
