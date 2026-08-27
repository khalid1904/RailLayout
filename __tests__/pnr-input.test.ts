import { describe, it, expect } from "vitest";
import {
  extractPnrsFromText,
  isValidPnr,
  validatePnrList,
  dedupePnrs,
} from "@/lib/validation/pnr-input";

describe("PNR validation", () => {
  it("validates a valid PNR", () => {
    expect(isValidPnr("1234567890")).toBe(true);
  });

  it("rejects invalid PNR", () => {
    expect(isValidPnr("123")).toBe(false);
    expect(isValidPnr("abcdefghij")).toBe(false);
  });

  it("extracts multiple PNRs from pasted text", () => {
    const text = `PNR 1234567890
PNR 2345678901
PNR 3456789012`;
    expect(extractPnrsFromText(text)).toEqual([
      "1234567890",
      "2345678901",
      "3456789012",
    ]);
  });

  it("deduplicates PNRs", () => {
    expect(dedupePnrs(["1234567890", "1234567890"])).toEqual(["1234567890"]);
  });

  it("separates valid, invalid, and duplicate PNRs", () => {
    const result = validatePnrList([
      "1234567890",
      "1234567890",
      "bad",
    ]);
    expect(result.valid).toEqual(["1234567890"]);
    expect(result.invalid).toEqual(["bad"]);
    expect(result.duplicates).toEqual(["1234567890"]);
  });
});
