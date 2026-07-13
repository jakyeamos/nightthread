"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteTrip({ tripId, tripName }: { tripId: string; tripName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deletionId, setDeletionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function remove(): Promise<void> {
    setError(null);
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/deletions`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetKind: "trip", targetId: tripId }) }).catch(() => null);
    if (!response?.ok) { setError("The trip could not be deleted."); return; }
    const result = await response.json() as { deletionId: string };
    setDeletionId(result.deletionId);
    timer.current = setTimeout(() => router.push("/trips"), 10_000);
  }
  async function undo(): Promise<void> {
    if (!deletionId) return;
    if (timer.current) clearTimeout(timer.current);
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/deletions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deletionId }) }).catch(() => null);
    if (!response?.ok) { setError("The undo window has expired."); return; }
    setDeletionId(null);
    setOpen(false);
    setConfirmation("");
    router.refresh();
  }
  if (deletionId) return <div role="status" className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4"><p className="text-sm font-semibold text-[var(--danger)]">Trip removed. It will be permanently purged after the undo window.</p><Button variant="ghost" onClick={() => void undo()} className="mt-3">Undo deletion</Button><p aria-live="polite" className="mt-2 text-xs text-[var(--danger)]">{error}</p></div>;
  if (!open) return <Button variant="danger" onClick={() => setOpen(true)}>Delete trip</Button>;
  return <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4"><p className="text-sm font-semibold text-[var(--danger)]">This removes the trip and everything in it. You will have ten seconds to undo.</p><label className="muted mt-3 block text-xs">Type <strong className="text-[var(--ink)]">{tripName}</strong> to confirm<input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--ink)]" /></label><div className="mt-3 flex gap-2"><Button variant="danger" disabled={confirmation !== tripName} onClick={() => void remove()}>Delete trip</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div><p aria-live="polite" className="mt-2 text-xs text-[var(--danger)]">{error}</p></div>;
}
