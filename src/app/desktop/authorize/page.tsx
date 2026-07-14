import type { Metadata } from "next";
import { headers } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Brand } from "@/components/brand";
import { DesktopAuthorization } from "@/components/desktop-authorization";
import { SignInCard } from "@/components/sign-in-card";
import { createAuth } from "@/auth/server";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Authorize desktop · Nightthread",
};

interface DesktopAuthorizePageProps {
  searchParams: Promise<{ user_code?: string }>;
}

export default async function DesktopAuthorizePage({ searchParams }: DesktopAuthorizePageProps) {
  const { user_code: userCode } = await searchParams;
  const { env } = await getCloudflareContext({ async: true });
  const session = await createAuth(env).api.getSession({ headers: await headers() });
  const callbackURL = `/desktop/authorize?user_code=${encodeURIComponent(userCode ?? "")}`;

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between"><Brand /><span className="text-xs text-[var(--muted)]">Secure browser handoff</span></div>
      <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-6xl items-center justify-center py-12">
        {!userCode ? (
          <div className="max-w-lg rounded-2xl bg-[var(--surface-raised)] p-8 text-center"><h1 className="text-2xl font-semibold">No desktop request found</h1><p className="muted mt-3 text-sm">Start sign-in from the Nightthread desktop application.</p></div>
        ) : session ? (
          <DesktopAuthorization userCode={userCode} />
        ) : (
          <SignInCard callbackURL={callbackURL} heading="Sign in to approve desktop" />
        )}
      </div>
    </main>
  );
}
