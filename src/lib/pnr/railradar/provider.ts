import type { NormalizedPNRResult, PNRProvider } from "../provider";
import { PNRProviderError } from "../provider";
import { fetchPNRFromRailRadar } from "./client";
import { mapRailRadarPNR } from "./mapper";
import { inspectRawPNRData, normalizeRawPNRData } from "./normalize-raw";
import { isValidPnr } from "@/lib/validation/pnr-input";

export class RailRadarPNRProvider implements PNRProvider {
  async checkPNR(pnr: string): Promise<NormalizedPNRResult> {
    if (!isValidPnr(pnr)) {
      throw new PNRProviderError("Invalid PNR format", "INVALID_PNR", 400);
    }

    const raw = await fetchPNRFromRailRadar(pnr);
    const normalizedRaw = normalizeRawPNRData(raw);
    const pnrRecord = mapRailRadarPNR(pnr, normalizedRaw);

    if (process.env.NODE_ENV === "development") {
      const diagnostics = inspectRawPNRData(raw, pnrRecord.passengers);
      console.log(
        `PNR normalized ${pnr.slice(-4).padStart(10, "•")} — ` +
          `${diagnostics.assignedCount}/${diagnostics.passengerCount} assigned, ` +
          `chart: ${diagnostics.chartStatus ?? "unknown"}, class: ${diagnostics.travelClass ?? "unknown"}`
      );
      if (diagnostics.assignedCount === 0 && diagnostics.passengerCount > 0) {
        console.log("PNR berth diagnostics:", {
          topLevelKeys: diagnostics.topLevelKeys,
          passengerKeys: diagnostics.passengerKeys,
          currentBlockKeys: diagnostics.currentBlockKeys,
          berthFieldsPresent: diagnostics.berthFieldsPresent,
          sampleStatuses: diagnostics.sampleStatuses,
        });
      }
    }

    return { pnr: pnrRecord };
  }
}

export const railRadarProvider = new RailRadarPNRProvider();
