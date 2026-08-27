"use client";

import { Badge } from "@/components/ui/badge";
import type { Trip } from "@/types/trip";
import {
  countCoaches,
  formatJourneyDate,
  getAllPassengers,
} from "@/lib/trip/journey-merge";

interface TripOverviewProps {
  trip: Trip;
  actions?: React.ReactNode;
}

export function TripOverview({ trip, actions }: TripOverviewProps) {
  const passengers = getAllPassengers(trip);
  const coaches = countCoaches(passengers);
  const { journey } = trip;

  return (
    <div className="material sticky top-[3.75rem] z-30 rounded-2xl px-4 py-4 md:px-5 md:py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink display-tight md:text-3xl">
            {journey.trainName || "Train Journey"}
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            {journey.boardingStation.name} → {journey.destinationStation.name}
          </p>
          <p className="text-sm text-slate-500">
            Train {journey.trainNumber}
            {journey.journeyDate &&
              ` · ${formatJourneyDate(journey.journeyDate)}`}
            {journey.travelClass && ` · ${journey.travelClass}`}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge>{trip.pnrs.length} PNRs</Badge>
            <Badge variant="secondary">{passengers.length} passengers</Badge>
            <Badge variant="secondary">{coaches} coaches</Badge>
            {trip.pnrs[0]?.chartStatus && (
              <Badge variant="outline">{trip.pnrs[0].chartStatus}</Badge>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
