"use client";

import { Check, Copy, Link2, RotateCcw } from "lucide-react";
import { useState } from "react";

export function InvitationLinkControl({ tripId, activeExpiresAt }: { tripId: string; activeExpiresAt: number | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(activeExpiresAt);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function generate(): Promise<void> {
    setError(null);
    const response = await fetch(`/api/trips/${encodeURIComponent(tripId)}/invitation`, { method: "POST" }).catch(() => null);
    if (!response?.ok) { setError("The invitation could not be generated."); return; }
    const result = await response.json() as { url: string; expiresAt: string };
    setUrl(result.url);
    setExpiresAt(new Date(result.expiresAt).getTime());
    setCopied(false);
  }
  async function copy(): Promise<void> {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }
  return <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Invitation link</p><p className="muted mt-1 text-xs">{expiresAt ? `An active link expires ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(expiresAt))}. Generate again to revoke it and receive a fresh URL.` : "No active invitation link."}</p></div><Link2 className="shrink-0 text-[var(--faint)]" size={18} /></div>{url && <code className="mt-4 block overflow-x-auto rounded-lg bg-[var(--surface-soft)] p-3 text-xs">{url}</code>}<div className="mt-4 flex gap-2"><button type="button" onClick={() => void generate()} aria-label={expiresAt ? "Regenerate invitation link" : "Generate invitation link"} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--indigo)] px-4 text-xs font-semibold text-white"><RotateCcw size={14} />{expiresAt ? "Regenerate link" : "Generate link"}</button>{url && <button type="button" onClick={() => void copy()} aria-label="Copy invitation link" className="surface inline-flex h-10 items-center gap-2 rounded-lg px-4 text-xs font-semibold">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>}</div><p aria-live="polite" className="mt-2 text-xs text-[var(--danger)]">{error}</p></div>;
}
