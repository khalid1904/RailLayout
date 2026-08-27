"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";
import { formatJourneyDate } from "@/lib/trip/journey-merge";

export function JourneyConflictPanel() {
  const { journeyConflicts, trip, clearTrip } = useTripStore();

  if (journeyConflicts.length === 0) return null;

  return (
    <div className="material rounded-2xl border border-amber-200/60 bg-amber-50/70 p-4 md:p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold tracking-tight text-amber-950">
            These PNRs belong to different journeys
          </h2>
          <div className="space-y-2">
            {trip?.pnrs.map((pnr) => (
              <div
                key={pnr.id}
                className="rounded-xl bg-white/70 px-3 py-2 text-sm"
              >
                <p className="font-mono font-medium">{pnr.maskedNumber}</p>
                <p>
                  Train {pnr.journey.trainNumber}{" "}
                  {pnr.journey.journeyDate &&
                    formatJourneyDate(pnr.journey.journeyDate)}
                </p>
                <p className="text-slate-600">
                  {pnr.journey.boardingStation.name} →{" "}
                  {pnr.journey.destinationStation.name}
                </p>
              </div>
            ))}
          </div>
          <p className="text-sm text-amber-900">
            Remove incompatible PNRs before merging into one coach map.
          </p>
          <Button variant="outline" onClick={clearTrip}>
            Clear and start over
          </Button>
        </div>
      </div>
    </div>
  );
}
