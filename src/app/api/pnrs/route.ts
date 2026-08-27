import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { railRadarProvider } from "@/lib/pnr/railradar/provider";
import { providerErrorToApi } from "@/lib/pnr/railradar/errors";
import {
  checkRateLimit,
  getCached,
  pnrCacheKey,
  setCache,
} from "@/lib/server/cache";
import { maskPnr } from "@/lib/privacy/mask-pnr";
import type { BatchPNRResponse } from "@/lib/pnr/provider";
import { dedupePnrs } from "@/lib/validation/pnr-input";

const bodySchema = z.object({
  pnrs: z
    .array(z.string().regex(/^[0-9]{10}$/))
    .min(1)
    .max(10),
  skipCache: z.boolean().optional(),
});

const CONCURRENCY = 3;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function processBatch<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip, 20)) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "RATE_LIMIT", message: "Too many requests" },
        },
        { status: 429 }
      );
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_PNR",
            message: "Invalid PNR list",
          },
        },
        { status: 400 }
      );
    }

    const uniquePnrs = dedupePnrs(parsed.data.pnrs);
    const { skipCache } = parsed.data;

    const results = await processBatch(uniquePnrs, CONCURRENCY, async (pnr) => {
      try {
        const cacheKey = pnrCacheKey(pnr);
        if (!skipCache) {
          const cached = getCached<
            Awaited<ReturnType<typeof railRadarProvider.checkPNR>>["pnr"]
          >(cacheKey);
          if (cached) {
            return {
              pnr,
              maskedPnr: maskPnr(pnr),
              success: true as const,
              data: cached,
            };
          }
        }

        const result = await railRadarProvider.checkPNR(pnr);
        setCache(cacheKey, result.pnr, 45_000);
        return {
          pnr,
          maskedPnr: maskPnr(pnr),
          success: true as const,
          data: result.pnr,
        };
      } catch (error) {
        const mapped = providerErrorToApi(error);
        return {
          pnr,
          maskedPnr: maskPnr(pnr),
          success: false as const,
          error: { code: mapped.code, message: mapped.message },
        };
      }
    });

    const response: BatchPNRResponse = { results };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: { code: "UNKNOWN", message: "An unexpected error occurred" },
      },
      { status: 500 }
    );
  }
}
