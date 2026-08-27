"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";
import {
  formatJourneyDate,
  getAllPassengers,
} from "@/lib/trip/journey-merge";

export function TripListPanel() {
  const trips = useTripStore((s) => s.trips);
  const openTrip = useTripStore((s) => s.openTrip);
  const editTrip = useTripStore((s) => s.editTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const createNewTripDraft = useTripStore((s) => s.createNewTripDraft);
  const setAppStep = useTripStore((s) => s.setAppStep);

  const sorted = trips
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16 pt-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink display-tight md:text-4xl">
            Trips
          </h1>
          <p className="mt-2 text-muted">
            Open a saved trip or create a new one with live PNRs.
          </p>
        </div>
        <Button
          type="button"
          className="pressable"
          onClick={() => createNewTripDraft()}
        >
          <Plus className="h-4 w-4" />
          Create a Trip
        </Button>
      </div>

      {sorted.length === 0 ? (
        <section className="material rounded-2xl p-8 text-center">
          <p className="text-muted">No trips yet.</p>
          <Button
            type="button"
            className="pressable mt-4"
            onClick={() => createNewTripDraft()}
          >
            Create your first trip
          </Button>
        </section>
      ) : (
        <ul className="space-y-3">
          {sorted.map((trip) => {
            const passengers = getAllPassengers(trip);
            const { journey } = trip;
            return (
              <li key={trip.id} className="material rounded-2xl p-4 md:p-5">
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => openTrip(trip.id)}
                >
                  <p className="font-display text-lg font-semibold tracking-tight text-ink">
                    {trip.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {journey.trainNumber}
                    {journey.trainName ? ` · ${journey.trainName}` : ""}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {journey.boardingStation.name} →{" "}
                    {journey.destinationStation.name}
                    {journey.journeyDate
                      ? ` · ${formatJourneyDate(journey.journeyDate)}`
                      : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {trip.pnrs.length} PNR{trip.pnrs.length === 1 ? "" : "s"} ·{" "}
                    {passengers.length} passenger
                    {passengers.length === 1 ? "" : "s"}
                  </p>
                </button>
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)] pt-3">
                  <Button
                    type="button"
                    size="sm"
                    className="pressable"
                    onClick={() => openTrip(trip.id)}
                  >
                    Open map
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="pressable"
                    onClick={() => editTrip(trip.id)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="pressable text-muted"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${trip.name}”? This cannot be undone.`
                        )
                      ) {
                        deleteTrip(trip.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="ghost"
        onClick={() => setAppStep("dashboard")}
      >
        Back to dashboard
      </Button>
    </div>
  );
}
