"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteTrip({ tripName }: { tripName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  if (!open) return <Button variant="danger" onClick={() => setOpen(true)}>Delete trip</Button>;
  return <div className="rounded-xl border border-[oklch(0.4_0.1_18)] bg-[var(--yarn-soft)] p-4"><p className="text-sm font-semibold">This schedules the trip and everything in it for deletion.</p><label className="muted mt-3 block text-xs">Type <strong className="text-white">{tripName}</strong> to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[oklch(0.4_0.1_18)] bg-[var(--night)] px-3 text-sm text-white" /></label><div className="mt-3 flex gap-2"><Button variant="danger" disabled={confirmation !== tripName}>Permanently delete</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></div>;
}
