"use client";

import { Map, Plus, Train } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";

export function DashboardPanel() {
  const trips = useTripStore((s) => s.trips);
  const setAppStep = useTripStore((s) => s.setAppStep);
  const createNewTripDraft = useTripStore((s) => s.createNewTripDraft);
  const openTrip = useTripStore((s) => s.openTrip);

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16 pt-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink display-tight md:text-4xl">
          Train Coach Planner
        </h1>
        <p className="mt-2 text-muted">
          Plan group travel with live PNR coach maps.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setAppStep("trips")}
          className="material pressable rounded-2xl p-5 text-left transition-colors hover:bg-surface-elevated"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Train className="h-5 w-5" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
            Trips
          </p>
          <p className="mt-1 text-sm text-muted">
            {trips.length === 0
              ? "No trips yet — open the trip module to get started."
              : `${trips.length} saved trip${trips.length === 1 ? "" : "s"}`}
          </p>
        </button>

        <button
          type="button"
          onClick={() => createNewTripDraft()}
          className="material pressable rounded-2xl p-5 text-left transition-colors hover:bg-surface-elevated"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">
            New Trip
          </p>
          <p className="mt-1 text-sm text-muted">
            Add PNRs and build a coach map from live journey data.
          </p>
        </button>
      </div>

      {trips.length > 0 && (
        <section className="material rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Recent
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAppStep("trips")}
            >
              View all
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {trips
              .slice()
              .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
              .slice(0, 3)
              .map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className="pressable flex w-full items-center gap-3 rounded-xl bg-surface-solid/70 px-3 py-3 text-left"
                    onClick={() => openTrip(t.id)}
                  >
                    <Map className="h-4 w-4 shrink-0 text-accent" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">
                        {t.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {t.journey.trainNumber} · {t.pnrs.length} PNR
                        {t.pnrs.length === 1 ? "" : "s"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
