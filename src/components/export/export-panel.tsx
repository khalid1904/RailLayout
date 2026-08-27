"use client";

import { useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";
import { getAllPassengers } from "@/lib/trip/journey-merge";

export function ExportPanel() {
  const trip = useTripStore((s) => s.trip);
  const setAppStep = useTripStore((s) => s.setAppStep);
  const updateExportPreferences = useTripStore(
    (s) => s.updateExportPreferences
  );
  const [loading, setLoading] = useState(false);

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-muted">No trip to export.</p>
        <Button className="mt-4" onClick={() => setAppStep("create")}>
          Create a Trip
        </Button>
      </div>
    );
  }

  const prefs = trip.exportPreferences;

  const handleExport = async () => {
    setLoading(true);
    try {
      const passengers = getAllPassengers(trip);
      const { generateTripPdf } = await import("@/lib/pdf/generator");
      const blob = await generateTripPdf(trip, passengers, prefs);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `train-coach-planner-${trip.journey.trainNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16 pt-2">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="pressable"
          onClick={() => setAppStep("layout")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink display-tight">
          Export
        </h1>
        <p className="mt-2 text-muted">
          Choose what to include in your travel PDF for {trip.name}.
        </p>
      </div>

      <section className="material rounded-2xl p-4 md:p-5">
        <div className="space-y-3 text-sm">
          {(
            [
              ["includeCoachDiagrams", "Coach diagrams"],
              ["includePassengerList", "Passenger list"],
              ["includeGroups", "Groups"],
              ["includeRelationships", "Relationships"],
              ["includeFullPnr", "Full PNR numbers"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex min-h-[44px] items-center gap-3">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  updateExportPreferences({ [key]: e.target.checked })
                }
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
              />
              <span className="text-ink">{label}</span>
            </label>
          ))}
          <p className="pt-2 text-muted">Paper: A4 · Orientation: Landscape</p>
        </div>
      </section>

      <Button
        className="pressable w-full"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your travel PDF…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Generate PDF
          </>
        )}
      </Button>
    </div>
  );
}
