"use client";

import { Check, Heart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

interface VoteButtonProps {
  initialCount: number;
  initialActive?: boolean;
  tripId?: string;
  ideaId?: string;
}

export function VoteButton({ initialCount, initialActive = false, tripId, ideaId }: VoteButtonProps) {
  const [active, setActive] = useState(initialActive);
  const [count, setCount] = useState(initialCount);
  const [error, setError] = useState(false);
  const reduced = useReducedMotion();
  async function toggle(): Promise<void> {
    const nextActive = !active;
    const nextCount = count + (nextActive ? 1 : -1);
    setActive(nextActive);
    setCount(nextCount);
    setError(false);
    if (!tripId || !ideaId) return;
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/ideas/${encodeURIComponent(ideaId)}/vote`, { method: "POST" }).catch(() => null);
    if (!response?.ok) {
      setActive(active);
      setCount(count);
      setError(true);
    }
  }
  return (
    <motion.button
      type="button"
      onClick={() => void toggle()}
      whileTap={reduced ? undefined : { scale: .92 }}
      aria-pressed={active}
      aria-label={`${active ? "Remove" : "Add"} want-to-do vote${error ? "; last update failed" : ""}`}
      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${active ? "bg-[var(--thread-soft)] text-[var(--thread-hover)]" : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]"}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={active ? "check" : "heart"} initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .6 }} transition={{ duration: reduced ? 0 : .16 }}>{active ? <Check size={13} /> : <Heart size={13} />}</motion.span>
      </AnimatePresence>{count}
    </motion.button>
  );
}
