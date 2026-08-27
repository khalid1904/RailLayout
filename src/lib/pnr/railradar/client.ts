import { PNRProviderError } from "../provider";
import { mapRailRadarError } from "./errors";
import type { RailRadarEnvelope, RailRadarPNRData } from "./types";
import { maskPnrForLog } from "@/lib/privacy/mask-pnr";

const BASE_URL = "https://api.railradar.in/v1";
const TIMEOUT_MS = 10_000;

function getApiKey(): string {
  const key = process.env.RAILRADAR_API_KEY;
  if (!key) {
    throw new PNRProviderError(
      "RailRadar API key is not configured",
      "PROVIDER_AUTH",
      500
    );
  }
  return key;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new PNRProviderError("RailRadar request timed out", "TIMEOUT", 504);
    }
    throw new PNRProviderError(
      "Network error contacting RailRadar",
      "UNAVAILABLE",
      503
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function railRadarGet<T>(path: string): Promise<T> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}${path}`;

  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  let body: RailRadarEnvelope<T> | null = null;
  try {
    body = (await response.json()) as RailRadarEnvelope<T>;
  } catch {
    if (!response.ok) {
      throw mapRailRadarError(response.status, null);
    }
    throw new PNRProviderError(
      "Malformed response from RailRadar",
      "MALFORMED",
      502
    );
  }

  if (!response.ok || body.success === false) {
    throw mapRailRadarError(response.status, body);
  }

  if (!body.data) {
    throw new PNRProviderError(
      "Empty response from RailRadar",
      "MALFORMED",
      502
    );
  }

  return body.data;
}

export async function fetchPNRFromRailRadar(
  pnr: string
): Promise<RailRadarPNRData> {
  if (process.env.NODE_ENV === "development") {
    console.log(`PNR request received ${maskPnrForLog(pnr)}`);
  }
  const data = await railRadarGet<RailRadarPNRData>(`/pnr/${pnr}`);
  if (process.env.NODE_ENV === "development") {
    console.log(`Provider request succeeded ${maskPnrForLog(pnr)}`);
  }
  return data;
}

export async function fetchCoachComposition(
  trainNumber: string
): Promise<unknown> {
  return railRadarGet(`/trains/${trainNumber}/coaches`);
}
