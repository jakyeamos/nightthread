import { cp, mkdir } from "node:fs/promises";

await mkdir(new URL("../dist/shell", import.meta.url), { recursive: true });
await cp(new URL("../src/shell", import.meta.url), new URL("../dist/shell", import.meta.url), { recursive: true });
