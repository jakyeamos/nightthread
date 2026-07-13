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
    primary: "bg-[var(--indigo)] text-white hover:bg-[var(--indigo-hover)]",
    secondary: "surface text-[var(--ink)] hover:bg-[var(--surface-soft)]",
    ghost: "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]",
    danger: "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[oklch(0.9_0.06_25)]",
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
