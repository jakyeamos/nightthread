import { readFile, unlink, writeFile } from "node:fs/promises";
import { z } from "zod";

export interface SecretEncryption {
  isEncryptionAvailable(): boolean;
  encryptString(value: string): Buffer;
  decryptString(value: Buffer): string;
}

const encryptedTokenSchema = z.object({
  version: z.literal(1),
  encryptedToken: z.string().min(1),
});

export class EncryptedTokenStore {
  constructor(
    private readonly path: string,
    private readonly encryption: SecretEncryption,
  ) {}

  isAvailable(): boolean {
    return this.encryption.isEncryptionAvailable();
  }

  async read(): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      const encoded = await readFile(this.path, "utf8");
      const payload = encryptedTokenSchema.parse(JSON.parse(encoded) as unknown);
      return this.encryption.decryptString(Buffer.from(payload.encryptedToken, "base64"));
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
      await this.clear();
      return null;
    }
  }

  async write(token: string): Promise<void> {
    if (!this.isAvailable()) throw new Error("Secure credential storage is unavailable on this device");
    const encryptedToken = this.encryption.encryptString(token).toString("base64");
    await writeFile(this.path, JSON.stringify({ version: 1, encryptedToken }), { encoding: "utf8", mode: 0o600 });
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.path);
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
    }
  }
}
