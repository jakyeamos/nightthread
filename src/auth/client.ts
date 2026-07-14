"use client";

import { createAuthClient } from "better-auth/react";
import { deviceAuthorizationClient, magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [deviceAuthorizationClient(), magicLinkClient()],
});
