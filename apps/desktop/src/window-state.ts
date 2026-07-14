import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";

export interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

const windowBoundsSchema = z.object({
  x: z.number().int().optional(),
  y: z.number().int().optional(),
  width: z.number().int().min(1024).max(10000),
  height: z.number().int().min(768).max(10000),
});

export async function readWindowBounds(path: string): Promise<WindowBounds> {
  try {
    const payload: unknown = JSON.parse(await readFile(path, "utf8"));
    return windowBoundsSchema.parse(payload);
  } catch {
    return { width: 1440, height: 900 };
  }
}

export async function writeWindowBounds(path: string, bounds: WindowBounds): Promise<void> {
  await writeFile(path, JSON.stringify(windowBoundsSchema.parse(bounds)), { encoding: "utf8", mode: 0o600 });
}

export function isVisibleOnDisplay(bounds: WindowBounds, workAreas: WindowBounds[]): boolean {
  if (bounds.x === undefined || bounds.y === undefined) return true;
  return workAreas.some((area) => {
    if (area.x === undefined || area.y === undefined) return false;
    const horizontalOverlap = bounds.x! < area.x + area.width && bounds.x! + bounds.width > area.x;
    const verticalOverlap = bounds.y! < area.y + area.height && bounds.y! + bounds.height > area.y;
    return horizontalOverlap && verticalOverlap;
  });
}
