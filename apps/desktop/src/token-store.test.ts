import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { EncryptedTokenStore, type SecretEncryption } from "./token-store";

const directories: string[] = [];
const encryption: SecretEncryption = {
  isEncryptionAvailable: () => true,
  encryptString: (value) => Buffer.from(`encrypted:${value}`, "utf8"),
  decryptString: (value) => value.toString("utf8").replace(/^encrypted:/, ""),
};

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("encrypted token storage", () => {
  it("persists only the encrypted representation", async () => {
    const directory = await mkdtemp(join(tmpdir(), "nightthread-token-"));
    directories.push(directory);
    const path = join(directory, "session.json");
    const store = new EncryptedTokenStore(path, encryption);
    await store.write("private-session-token");
    expect(await readFile(path, "utf8")).not.toContain("private-session-token");
    await expect(store.read()).resolves.toBe("private-session-token");
    await store.clear();
    await expect(store.read()).resolves.toBeNull();
  });

  it("refuses plaintext persistence when encryption is unavailable", async () => {
    const store = new EncryptedTokenStore("unused", { ...encryption, isEncryptionAvailable: () => false });
    await expect(store.write("token")).rejects.toThrow("Secure credential storage");
  });
});
