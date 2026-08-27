"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Trip } from "@/types/trip";
import { getAllPassengers } from "@/lib/trip/journey-merge";
import { useTripStore } from "@/store/trip-store";

interface ExportDialogProps {
  trip: Trip;
}

export function ExportDialog({ trip }: ExportDialogProps) {
  const updateExportPreferences = useTripStore(
    (s) => s.updateExportPreferences
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
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
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="pressable">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Trip</DialogTitle>
        </DialogHeader>
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
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  updateExportPreferences({ [key]: e.target.checked })
                }
                className="h-4 w-4 rounded border-stone-300"
              />
              {label}
            </label>
          ))}
          <p className="text-stone-500">Paper: A4 · Orientation: Landscape</p>
        </div>
        <Button onClick={handleExport} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing your travel PDF...
            </>
          ) : (
            "Generate PDF"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
