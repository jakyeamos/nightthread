"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteTrip({ tripName }: { tripName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  if (!open) return <Button variant="danger" onClick={() => setOpen(true)}>Delete trip</Button>;
  return <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4"><p className="text-sm font-semibold text-[var(--danger)]">This schedules the trip and everything in it for deletion.</p><label className="muted mt-3 block text-xs">Type <strong className="text-[var(--ink)]">{tripName}</strong> to confirm<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]" /></label><div className="mt-3 flex gap-2"><Button variant="danger" disabled={confirmation !== tripName}>Permanently delete</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></div>;
}
