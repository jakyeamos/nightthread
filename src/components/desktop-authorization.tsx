"use client";

import { Check, Laptop, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const deviceStatusSchema = z.object({
  user_code: z.string(),
  status: z.enum(["pending", "approved", "denied"]),
});

type AuthorizationDecision = "approved" | "denied";

interface DesktopAuthorizationProps {
  userCode: string;
}

export function DesktopAuthorization({ userCode }: DesktopAuthorizationProps) {
  const [status, setStatus] = useState<"loading" | "pending" | "error">("loading");
  const [decision, setDecision] = useState<AuthorizationDecision | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const claimDevice = async (): Promise<void> => {
      const response = await fetch(`/api/auth/device?user_code=${encodeURIComponent(userCode)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const parsed = deviceStatusSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success || parsed.data.status !== "pending") {
        setStatus("error");
        return;
      }
      setStatus("pending");
    };
    void claimDevice();
  }, [userCode]);

  async function decide(nextDecision: AuthorizationDecision): Promise<void> {
    setPending(true);
    const response = await fetch(`/api/auth/device/${nextDecision === "approved" ? "approve" : "deny"}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userCode }),
    });
    setPending(false);
    if (response.ok) setDecision(nextDecision);
    else setStatus("error");
  }

  if (decision) {
    return (
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface-raised)] p-8 text-center shadow-[0_6px_18px_oklch(0.35_0.04_245/.1)]">
        <span className={`mx-auto mb-5 grid size-14 place-items-center rounded-full ${decision === "approved" ? "bg-[var(--positive-soft)] text-[var(--positive)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
          {decision === "approved" ? <Check /> : <X />}
        </span>
        <h1 className="text-2xl font-semibold">{decision === "approved" ? "Nightthread desktop is connected" : "Connection denied"}</h1>
        <p className="muted mt-3 text-sm leading-6">You can close this browser window and return to the Nightthread application.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl bg-[var(--surface-raised)] p-8 shadow-[0_6px_18px_oklch(0.35_0.04_245/.1)]">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-xl bg-[var(--indigo-soft)] text-[var(--indigo)]"><Laptop /></span>
        <div>
          <p className="eyebrow">Desktop authorization</p>
          <h1 className="mt-1 text-2xl font-semibold">Connect Nightthread desktop?</h1>
        </div>
      </div>
      <div className="mt-7 rounded-xl bg-[var(--surface-soft)] p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck size={17} className="text-[var(--positive)]" />Nightthread desktop application</p>
        <p className="muted mt-2 text-sm leading-6">This lets the installed app open your private trips and collaborate as you. Your sign-in token is encrypted on this device and never appears in a link.</p>
        <p className="mt-4 font-mono text-sm tracking-[.16em] text-[var(--ink)]">Code {userCode}</p>
      </div>
      {status === "error" ? (
        <p role="alert" className="mt-5 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">This request is invalid, expired, or has already been handled. Start sign-in again from the desktop app.</p>
      ) : (
        <div className="mt-7 flex justify-end gap-3">
          <Button type="button" variant="secondary" disabled={pending || status === "loading"} onClick={() => void decide("denied")}>Deny</Button>
          <Button type="button" disabled={pending || status === "loading"} onClick={() => void decide("approved")}>{pending ? "Working…" : "Approve connection"}</Button>
        </div>
      )}
    </div>
  );
}
