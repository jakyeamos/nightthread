import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const SECRET_PATTERN = /(authorization|bearer|access_token|device_code|session)[^\n]*/gi;

export function sanitizeLogMessage(message: string): string {
  return message.replace(SECRET_PATTERN, "[redacted]").slice(0, 2000);
}

export class DesktopLogger {
  constructor(private readonly path: string) {}

  async write(level: "info" | "warn" | "error", message: string): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const line = `${new Date().toISOString()} ${level.toUpperCase()} ${sanitizeLogMessage(message)}\n`;
    await appendFile(this.path, line, { encoding: "utf8", mode: 0o600 });
  }
}
