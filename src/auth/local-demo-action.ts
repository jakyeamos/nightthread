"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isCurrentLocalDemoRequest, LOCAL_DEMO_COOKIE, LOCAL_DEMO_USER } from "@/auth/local-demo";

export async function signInLocalDemo(): Promise<void> {
  const requestHeaders = await headers();
  if (!isCurrentLocalDemoRequest(requestHeaders.get("host"))) throw new Error("LOCAL_DEMO_AUTH_DISABLED");
  const now = Date.now();
  const { env } = getCloudflareContext();
  await env.DB.prepare(
    `insert into user (id,name,email,email_verified,image,created_at,updated_at)
     values (?1,?2,?3,1,null,?4,?4)
     on conflict(id) do update set name=excluded.name,email=excluded.email,email_verified=1,updated_at=excluded.updated_at`,
  ).bind(LOCAL_DEMO_USER.id, LOCAL_DEMO_USER.name, LOCAL_DEMO_USER.email, now).run();
  const cookieStore = await cookies();
  cookieStore.set(LOCAL_DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/trips");
}
