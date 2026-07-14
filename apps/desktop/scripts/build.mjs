import { build } from "esbuild";

const packagedOrigin = process.env.NIGHTTHREAD_WEB_ORIGIN ?? "";
if (process.env.NIGHTTHREAD_DESKTOP_PACKAGE === "true") {
  const origin = new URL(packagedOrigin);
  if (origin.protocol !== "https:" || origin.origin !== origin.href.replace(/\/$/, "")) {
    throw new Error("Packaged desktop builds require NIGHTTHREAD_WEB_ORIGIN to be a clean HTTPS origin");
  }
}

await Promise.all([
  build({
    entryPoints: ["src/main.ts"],
    outfile: "dist/main.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron", "electron-updater"],
    define: { __NIGHTTHREAD_PACKAGED_WEB_ORIGIN__: JSON.stringify(packagedOrigin) },
  }),
  build({
    entryPoints: ["src/preload.ts"],
    outfile: "dist/preload.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron"],
  }),
  build({
    entryPoints: ["src/shell.ts"],
    outfile: "dist/shell.js",
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "chrome140",
  }),
]);
