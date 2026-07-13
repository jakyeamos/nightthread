"use client";

import { Check, Heart } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

export function VoteButton({ initialCount }: { initialCount: number }) {
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={() => setActive((value) => !value)}
      whileTap={reduced ? undefined : { scale: .92 }}
      aria-pressed={active}
      aria-label={`${active ? "Remove" : "Add"} want-to-do vote`}
      className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors ${active ? "bg-[var(--yarn-soft)] text-[oklch(0.82_0.13_18)]" : "bg-[var(--night-soft)] text-[var(--muted)] hover:text-white"}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={active ? "check" : "heart"} initial={{ opacity: 0, scale: .6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .6 }} transition={{ duration: reduced ? 0 : .16 }}>{active ? <Check size={13} /> : <Heart size={13} />}</motion.span>
      </AnimatePresence>{initialCount + (active ? 1 : 0)}
    </motion.button>
  );
}
