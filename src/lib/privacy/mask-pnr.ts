export function maskPnr(pnr: string): string {
  if (pnr.length !== 10) return "••••••••••";
  return `••••${pnr.slice(-4)}`;
}

export function maskPnrForLog(pnr: string): string {
  return maskPnr(pnr);
}

export function sanitizeUserText(value: string, maxLength = 200): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .trim()
    .slice(0, maxLength);
}
