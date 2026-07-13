declare global {
  interface CloudflareEnv {
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    RESEND_API_KEY: string;
    RESEND_FROM: string;
    GEOAPIFY_API_KEY: string;
    UNSPLASH_ACCESS_KEY: string;
  }
}

export {};
