import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { bearer, deviceAuthorization, magicLink } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import { Resend } from "resend";
import * as schema from "@/db/schema";
import { isDesktopAuthClient } from "@/auth/desktop";

export function createAuth(env: CloudflareEnv) {
  const database = drizzle(env.DB, { schema });
  return betterAuth({
    appName: "Nightthread",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 300,
      },
    },
    plugins: [
      bearer(),
      deviceAuthorization({
        expiresIn: "10m",
        interval: "5s",
        verificationUri: "/desktop/authorize",
        validateClient: isDesktopAuthClient,
      }),
      magicLink({
        expiresIn: 600,
        storeToken: "hashed",
        async sendMagicLink({ email, url }): Promise<void> {
          const resend = new Resend(env.RESEND_API_KEY);
          const { error } = await resend.emails.send({
            from: env.RESEND_FROM,
            to: email,
            subject: "Your Nightthread sign-in link",
            text: `Open Nightthread: ${url}\n\nThis link expires in 10 minutes and can only be used once.`,
          });
          if (error) throw new Error(error.message);
        },
      }),
    ],
  });
}

export type NightthreadAuth = ReturnType<typeof createAuth>;
