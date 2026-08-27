import type { Passenger } from "@/types/passenger";
import type { PNRRecord } from "@/types/pnr";
import type { PassengerMetadata } from "@/types/passenger";

export interface PassengerChange {
  passengerId: string;
  passengerName: string;
  field: "coach" | "berth" | "bookingStatus" | "currentStatus" | "chartStatus";
  before: string;
  after: string;
}

export interface RefreshDiff {
  changes: PassengerChange[];
  hasChanges: boolean;
}

function formatBerth(p: Passenger): string {
  if (!p.isAssigned) return "Not assigned";
  return `${p.coach} / ${p.berthNumber}${p.berthType ? ` · ${p.berthType}` : ""}`;
}

export function diffPNRRecords(
  previous: PNRRecord[],
  current: PNRRecord[]
): RefreshDiff {
  const changes: PassengerChange[] = [];
  const prevMap = new Map<string, Passenger>();

  for (const pnr of previous) {
    for (const p of pnr.passengers) {
      prevMap.set(p.id, p);
    }
  }

  for (const pnr of current) {
    for (const p of pnr.passengers) {
      const prev = prevMap.get(p.id);
      if (!prev) continue;

      if (prev.coach !== p.coach) {
        changes.push({
          passengerId: p.id,
          passengerName: p.originalName,
          field: "coach",
          before: prev.coach ?? "Not assigned",
          after: p.coach ?? "Not assigned",
        });
      }

      const prevBerth = formatBerth(prev);
      const currBerth = formatBerth(p);
      if (prevBerth !== currBerth) {
        changes.push({
          passengerId: p.id,
          passengerName: p.originalName,
          field: "berth",
          before: prevBerth,
          after: currBerth,
        });
      }

      if (prev.bookingStatus !== p.bookingStatus) {
        changes.push({
          passengerId: p.id,
          passengerName: p.originalName,
          field: "bookingStatus",
          before: prev.bookingStatus,
          after: p.bookingStatus,
        });
      }

      if (prev.currentStatus !== p.currentStatus) {
        changes.push({
          passengerId: p.id,
          passengerName: p.originalName,
          field: "currentStatus",
          before: prev.currentStatus,
          after: p.currentStatus,
        });
      }
    }

    const prevPnr = previous.find((x) => x.id === pnr.id);
    if (prevPnr && prevPnr.chartStatus !== pnr.chartStatus) {
      changes.push({
        passengerId: pnr.id,
        passengerName: "Chart",
        field: "chartStatus",
        before: prevPnr.chartStatus ?? "Unknown",
        after: pnr.chartStatus ?? "Unknown",
      });
    }
  }

  return { changes, hasChanges: changes.length > 0 };
}

export function mergeMetadata(
  existing: Record<string, PassengerMetadata>,
  newPassengers: Passenger[]
): Record<string, PassengerMetadata> {
  const merged = { ...existing };
  for (const p of newPassengers) {
    if (merged[p.id]) continue;
    merged[p.id] = {};
  }
  const validIds = new Set(newPassengers.map((p) => p.id));
  for (const id of Object.keys(merged)) {
    if (!validIds.has(id)) {
      delete merged[id];
    }
  }
  return merged;
}
