import { PNRProviderError } from "../provider";
import type { RailRadarEnvelope } from "./types";

export function mapRailRadarError(
  status: number,
  body: RailRadarEnvelope<unknown> | null
): PNRProviderError {
  const message =
    body?.error?.message ??
    (status === 404
      ? "PNR not found"
      : status === 401 || status === 403
        ? "RailRadar authentication failed"
        : status === 429
          ? "Rate limit exceeded"
          : status >= 500
            ? "RailRadar service unavailable"
            : "Unable to retrieve PNR");

  if (status === 404) {
    return new PNRProviderError(message, "PNR_NOT_FOUND", 404);
  }
  if (status === 401 || status === 403) {
    return new PNRProviderError(message, "PROVIDER_AUTH", status);
  }
  if (status === 429) {
    return new PNRProviderError(message, "RATE_LIMIT", 429);
  }
  if (status >= 500) {
    return new PNRProviderError(message, "UNAVAILABLE", status);
  }
  if (body?.success === false) {
    return new PNRProviderError(message, "UNKNOWN", status || 400);
  }
  return new PNRProviderError(message, "MALFORMED", status || 502);
}

export function providerErrorToApi(error: unknown): {
  code: string;
  message: string;
  statusCode: number;
} {
  if (error instanceof PNRProviderError) {
    return {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
  }
  return {
    code: "UNKNOWN",
    message: "An unexpected error occurred",
    statusCode: 500,
  };
}
