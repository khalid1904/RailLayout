const PNR_REGEX = /\b[0-9]{10}\b/g;
const VALID_PNR = /^[0-9]{10}$/;

export function isValidPnr(pnr: string): boolean {
  return VALID_PNR.test(pnr.trim());
}

export function normalizePnr(pnr: string): string {
  return pnr.trim();
}

export function extractPnrsFromText(text: string): string[] {
  const matches = text.match(PNR_REGEX) ?? [];
  return [...new Set(matches)];
}

export function dedupePnrs(pnrs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const pnr of pnrs) {
    const normalized = normalizePnr(pnr);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

export function validatePnrList(pnrs: string[]): {
  valid: string[];
  invalid: string[];
  duplicates: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<string>();

  for (const raw of pnrs) {
    const pnr = normalizePnr(raw);
    if (!isValidPnr(pnr)) {
      invalid.push(raw);
      continue;
    }
    if (seen.has(pnr)) {
      duplicates.push(pnr);
      continue;
    }
    seen.add(pnr);
    valid.push(pnr);
  }

  return { valid, invalid, duplicates };
}
