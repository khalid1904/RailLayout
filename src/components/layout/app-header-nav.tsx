"use client";

import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";

export function AppHeaderNav() {
  const trip = useTripStore((s) => s.trip);
  const trips = useTripStore((s) => s.trips);
  const appStep = useTripStore((s) => s.appStep);
  const setAppStep = useTripStore((s) => s.setAppStep);
  const createNewTripDraft = useTripStore((s) => s.createNewTripDraft);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="pressable hidden sm:inline-flex"
        onClick={() => setAppStep("dashboard")}
      >
        Home
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="pressable"
        onClick={() => setAppStep("trips")}
      >
        Trips{trips.length > 0 ? ` (${trips.length})` : ""}
      </Button>
      {trip && appStep !== "layout" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="pressable hidden md:inline-flex"
          onClick={() => setAppStep("layout")}
        >
          Map
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="pressable"
        onClick={() => createNewTripDraft()}
      >
        + New Trip
      </Button>
    </>
  );
}
