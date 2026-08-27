import type { PNRRecord } from "@/types/pnr";
import type { Trip } from "@/types/trip";
import type { Passenger, PassengerMetadata } from "@/types/passenger";
import {
  journeyCompatibilityKey,
  type Journey,
} from "@/types/journey";

export interface JourneyConflict {
  pnr: string;
  maskedPnr: string;
  journey: Journey;
}

export interface MergeResult {
  compatible: boolean;
  journey: Journey | null;
  pnrs: PNRRecord[];
  conflicts: JourneyConflict[];
}

export function mergePNRs(pnrs: PNRRecord[]): MergeResult {
  if (pnrs.length === 0) {
    return { compatible: true, journey: null, pnrs: [], conflicts: [] };
  }

  const journeys = pnrs.map((p) => ({
    pnr: p.number,
    maskedPnr: p.maskedNumber,
    key: journeyCompatibilityKey(p.journey),
    journey: p.journey,
  }));

  const firstKey = journeys[0].key;
  const conflicts = journeys
    .filter((j) => j.key !== firstKey)
    .map((j) => ({
      pnr: j.pnr,
      maskedPnr: j.maskedPnr,
      journey: j.journey,
    }));

  return {
    compatible: conflicts.length === 0,
    journey: journeys[0].journey,
    pnrs,
    conflicts,
  };
}

export function getAllPassengers(trip: Trip): Passenger[] {
  const metadata = trip.passengerMetadata;
  return trip.pnrs.flatMap((pnr) =>
    pnr.passengers.map((p) => ({
      ...p,
      ...metadata[p.id],
    }))
  );
}

export function applyMetadataToPassengers(
  passengers: Passenger[],
  metadata: Record<string, PassengerMetadata>
): Passenger[] {
  return passengers.map((p) => ({
    ...p,
    ...metadata[p.id],
  }));
}

export function countCoaches(passengers: Passenger[]): number {
  const coaches = new Set(
    passengers.filter((p) => p.coach).map((p) => p.coach!)
  );
  return coaches.size;
}

export function formatJourneyDate(date: string): string {
  if (!date) return "";
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return date;
}
