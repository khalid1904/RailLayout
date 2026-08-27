import { describe, it, expect } from "vitest";
import { maskPnr } from "@/lib/privacy/mask-pnr";

describe("Privacy", () => {
  it("masks PNR by default", () => {
    expect(maskPnr("1234567890")).toBe("••••7890");
  });
});

describe("PDF options", () => {
  it("defaults full PNR export to disabled", async () => {
    const { DEFAULT_EXPORT_PREFERENCES } = await import("@/types/trip");
    expect(DEFAULT_EXPORT_PREFERENCES.includeFullPnr).toBe(false);
    expect(DEFAULT_EXPORT_PREFERENCES.includeCoachDiagrams).toBe(true);
  });
});
