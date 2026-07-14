import { build } from "esbuild";

await Promise.all([
  build({
    entryPoints: ["src/main.ts"],
    outfile: "dist/main.js",
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: ["electron", "electron-updater"],
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
