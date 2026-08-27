import type { PNRRecord } from "@/types/pnr";

export class PNRProviderError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_PNR"
      | "PNR_NOT_FOUND"
      | "PROVIDER_AUTH"
      | "RATE_LIMIT"
      | "TIMEOUT"
      | "MALFORMED"
      | "UNAVAILABLE"
      | "UNKNOWN",
    public readonly statusCode = 500
  ) {
    super(message);
    this.name = "PNRProviderError";
  }
}

export interface NormalizedPNRResult {
  pnr: PNRRecord;
}

export interface PNRProvider {
  checkPNR(pnr: string): Promise<NormalizedPNRResult>;
}

export interface PNRApiError {
  code: string;
  message: string;
}

export interface PNRApiSuccess {
  success: true;
  data: PNRRecord;
}

export interface PNRApiFailure {
  success: false;
  error: PNRApiError;
}

export type PNRApiResponse = PNRApiSuccess | PNRApiFailure;

export interface BatchPNRResult {
  pnr: string;
  maskedPnr: string;
  success: boolean;
  data?: PNRRecord;
  error?: PNRApiError;
}

export interface BatchPNRResponse {
  results: BatchPNRResult[];
}
