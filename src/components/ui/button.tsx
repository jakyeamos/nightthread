"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  const reduced = useReducedMotion();
  const variants = {
    primary: "bg-[var(--ink)] text-[var(--night)] hover:bg-white",
    secondary: "surface text-[var(--ink)] hover:bg-[var(--night-soft)]",
    ghost: "text-[var(--muted)] hover:bg-[var(--night-soft)] hover:text-[var(--ink)]",
    danger: "bg-[var(--yarn-soft)] text-[oklch(0.82_0.13_18)] hover:bg-[oklch(0.27_0.09_18)]",
  };
  return (
    <motion.button
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.16 }}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
