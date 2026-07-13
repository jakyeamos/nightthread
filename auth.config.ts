import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  appName: "Nightthread",
  baseURL: "http://localhost:3000",
  secret: "nightthread-schema-generation-secret-32-characters",
  socialProviders: {
    google: {
      clientId: "schema-generation-client",
      clientSecret: "schema-generation-secret",
    },
  },
  plugins: [
    magicLink({
      expiresIn: 600,
      storeToken: "hashed",
      sendMagicLink: async (): Promise<void> => undefined,
    }),
  ],
});
