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

const bodySchema = z.object({
  pnr: z.string().regex(/^[0-9]{10}$/, "Invalid PNR format"),
  skipCache: z.boolean().optional(),
});

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!checkRateLimit(ip)) {
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
            message: parsed.error.issues[0]?.message ?? "Invalid request",
          },
        },
        { status: 400 }
      );
    }

    const { pnr, skipCache } = parsed.data;
    const cacheKey = pnrCacheKey(pnr);

    if (!skipCache) {
      const cached = getCached<
        Awaited<ReturnType<typeof railRadarProvider.checkPNR>>["pnr"]
      >(cacheKey);
      if (cached) {
        return NextResponse.json({ success: true, data: cached });
      }
    }

    const result = await railRadarProvider.checkPNR(pnr);
    setCache(cacheKey, result.pnr, 45_000);

    return NextResponse.json({ success: true, data: result.pnr });
  } catch (error) {
    const mapped = providerErrorToApi(error);
    if (process.env.NODE_ENV === "development") {
      console.error("PNR API error", mapped.code);
    }
    return NextResponse.json(
      { success: false, error: { code: mapped.code, message: mapped.message } },
      { status: mapped.statusCode }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
