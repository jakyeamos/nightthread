"use client";

import { ArrowRight, Check, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import { signInLocalDemo } from "@/auth/local-demo-action";
import { authClient } from "@/auth/client";
import { Button } from "@/components/ui/button";

interface SignInCardProps {
  allowLocalDemo?: boolean;
  callbackURL?: string;
  heading?: string;
}

export function SignInCard({ allowLocalDemo = true, callbackURL = "/trips", heading = "Continue to your trips" }: SignInCardProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localDemoEnabled = allowLocalDemo && process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  async function sendLink(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.signIn.magicLink({ email, callbackURL });
    setPending(false);
    if (!result.error) setSent(true);
    else setError("Magic-link sign-in is not configured for this environment.");
  }

  async function signInWithGoogle(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({ provider: "google", callbackURL });
    setPending(false);
    if (result.error) setError("Google sign-in is not configured for this environment.");
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-[var(--surface-raised)] p-6 shadow-[0_6px_18px_oklch(0.35_0.04_245/.1)] md:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 text-center">
            <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-[var(--positive-soft)] text-[var(--positive)]"><Check /></span>
            <h2 className="text-lg font-semibold">Check your inbox</h2>
            <p className="muted mt-2 text-sm leading-6">We sent a single-use sign-in link to {email}. It expires in 10 minutes.</p>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow">Private by default</p>
            <h2 className="mt-2 text-xl font-semibold">{heading}</h2>
            <form onSubmit={sendLink} className="mt-6 space-y-3">
              <label className="block text-sm font-medium" htmlFor="email">Email address</label>
              <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--faint)]" size={17} /><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]" /></div>
              <Button disabled={pending} className="w-full" type="submit">{pending ? "Sending…" : "Email me a magic link"}<ArrowRight size={16} /></Button>
            </form>
            <div className="my-5 flex items-center gap-3 text-xs text-[var(--faint)]"><span className="h-px flex-1 bg-[var(--line)]" />or<span className="h-px flex-1 bg-[var(--line)]" /></div>
            <Button disabled={pending} type="button" variant="secondary" className="w-full" onClick={signInWithGoogle}>Continue with Google</Button>
            {error && <p role="alert" className="mt-3 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-xs leading-5 text-[var(--danger)]">{error}</p>}
            {localDemoEnabled && <><form action={signInLocalDemo} className="mt-3"><Button disabled={pending} type="submit" variant="secondary" className="w-full">Continue locally for testing</Button></form><Link href="/trips/demo/planner" className="mt-4 flex items-center justify-center text-sm text-[var(--muted)] hover:text-[var(--indigo)]">Explore the Tokyo demo <ArrowRight className="ml-1" size={14} /></Link></>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
