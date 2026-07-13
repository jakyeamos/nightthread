"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center px-6"><div className="surface max-w-md rounded-2xl p-7 text-center"><p className="eyebrow">The thread snagged</p><h1 className="display mt-3 text-4xl">Something didn’t load.</h1><p className="muted mt-3 text-sm leading-6">Your trip data is safe. Try this view again; if the problem persists, return to your trips.</p><div className="mt-6 flex justify-center gap-2"><Button onClick={reset}>Try again</Button><Link className="surface inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold" href="/trips">All trips</Link></div></div></main>;
}
