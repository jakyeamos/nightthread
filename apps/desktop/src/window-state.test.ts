import { describe, expect, it } from "vitest";
import { isVisibleOnDisplay } from "./window-state";

describe("window restoration", () => {
  it("restores visible bounds and rejects disconnected-display positions", () => {
    const displays = [{ x: 0, y: 0, width: 1728, height: 1117 }];
    expect(isVisibleOnDisplay({ x: 100, y: 100, width: 1440, height: 900 }, displays)).toBe(true);
    expect(isVisibleOnDisplay({ x: 3000, y: 100, width: 1440, height: 900 }, displays)).toBe(false);
  });
});
