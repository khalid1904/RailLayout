"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { JourneyConflictPanel } from "@/components/trip/journey-conflict-panel";
import { useTripStore } from "@/store/trip-store";
import {
  extractPnrsFromText,
  isValidPnr,
  normalizePnr,
} from "@/lib/validation/pnr-input";
import { maskPnr } from "@/lib/privacy/mask-pnr";
import { formatJourneyDate } from "@/lib/trip/journey-merge";
import type { PNRRecord } from "@/types/pnr";

async function fetchSinglePNR(
  pnr: string
): Promise<{ success: true; data: PNRRecord } | { success: false; error: string }> {
  const res = await fetch("/api/pnr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pnr }),
  });
  const json = await res.json();
  if (!json.success) {
    return {
      success: false,
      error: json.error?.message ?? "Unable to retrieve PNR",
    };
  }
  return { success: true, data: json.data };
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
      {children}
    </label>
  );
}

export function CreateTripPanel() {
  const {
    trip,
    pendingPnrs,
    fetchQueue,
    journeyConflicts,
    addPendingPnr,
    addPendingPnrs,
    removePendingPnr,
    clearPendingPnrs,
    setFetchQueue,
    updateFetchQueueItem,
    setTripFromPnrs,
    addPnrsToTrip,
    removePnrFromTrip,
    clearTrip,
    updateTripName,
    setAppStep,
  } = useTripStore();

  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [draftName, setDraftName] = useState("");

  const journey = trip?.journey;
  const hasConflict = journeyConflicts.length > 0;
  const canViewMap = Boolean(trip) && !hasConflict;

  const tripNameValue = trip?.name ?? draftName;

  const handleNameChange = (value: string) => {
    if (trip) updateTripName(value);
    else setDraftName(value);
  };

  const handleAdd = useCallback(() => {
    setInputError("");
    const extracted = extractPnrsFromText(input);
    if (extracted.length > 0) {
      addPendingPnrs(extracted);
      setInput("");
      setShowPasteHint(false);
      return;
    }
    const pnr = normalizePnr(input);
    if (!isValidPnr(pnr)) {
      setInputError("Enter a valid 10-digit PNR");
      return;
    }
    addPendingPnr(pnr);
    setInput("");
  }, [input, addPendingPnr, addPendingPnrs]);

  const handleFetch = useCallback(async () => {
    if (pendingPnrs.length === 0 || isFetching) return;
    setIsFetching(true);
    const queue = pendingPnrs.map((pnr) => ({
      pnr,
      status: "pending" as const,
    }));
    setFetchQueue(queue);

    const successful: PNRRecord[] = [];
    for (const item of queue) {
      updateFetchQueueItem(item.pnr, { status: "fetching" });
      const result = await fetchSinglePNR(item.pnr);
      if (result.success) {
        updateFetchQueueItem(item.pnr, { status: "success" });
        successful.push(result.data);
      } else {
        updateFetchQueueItem(item.pnr, {
          status: "error",
          error: result.error,
        });
      }
    }

    if (successful.length > 0) {
      if (trip) addPnrsToTrip(successful);
      else {
        setTripFromPnrs(successful);
        if (draftName.trim()) {
          // Applied after store creates trip
          queueMicrotask(() => updateTripName(draftName.trim()));
        }
      }
    }
    setIsFetching(false);
  }, [
    pendingPnrs,
    isFetching,
    setFetchQueue,
    updateFetchQueueItem,
    trip,
    addPnrsToTrip,
    setTripFromPnrs,
    draftName,
    updateTripName,
  ]);

  const coachSummary = useMemo(() => {
    if (!trip) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const pnr of trip.pnrs) {
      const coaches = [
        ...new Set(
          pnr.passengers
            .map((p) => p.coach)
            .filter((c): c is string => Boolean(c))
        ),
      ];
      map.set(
        pnr.id,
        coaches.length > 0 ? `Coach ${coaches.join(", ")}` : "Coach pending"
      );
    }
    return map;
  }, [trip]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-16 pt-2">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink display-tight md:text-4xl">
          Create a Trip
        </h1>
        <p className="mt-2 text-muted">
          Enter your trip details and add PNR numbers to build your coach map.
        </p>
      </div>

      <section className="material rounded-2xl p-4 md:p-5">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Trip details
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <FieldLabel>Trip name</FieldLabel>
            <Input
              placeholder="e.g. Chennai → Madurai Trip"
              value={tripNameValue}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Train number</FieldLabel>
              <Input
                readOnly
                placeholder="Auto-filled from PNR"
                value={journey?.trainNumber ?? ""}
              />
            </div>
            <div>
              <FieldLabel>Train name</FieldLabel>
              <Input
                readOnly
                placeholder="Auto-filled from PNR"
                value={journey?.trainName ?? ""}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Journey date</FieldLabel>
            <Input
              readOnly
              placeholder="dd/mm/yyyy"
              value={
                journey?.journeyDate
                  ? formatJourneyDate(journey.journeyDate)
                  : ""
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>From</FieldLabel>
              <Input
                readOnly
                placeholder="Auto-filled from PNR"
                value={journey?.boardingStation.name ?? ""}
              />
            </div>
            <div>
              <FieldLabel>To</FieldLabel>
              <Input
                readOnly
                placeholder="Auto-filled from PNR"
                value={journey?.destinationStation.name ?? ""}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="material rounded-2xl p-4 md:p-5">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Add PNR
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter 10-digit PNR number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              inputMode="numeric"
            />
            <Button
              type="button"
              className="pressable shrink-0"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          {inputError && <p className="text-sm text-red-600">{inputError}</p>}
          <button
            type="button"
            className="text-sm font-medium text-accent hover:underline"
            onClick={() => setShowPasteHint((v) => !v)}
          >
            Paste multiple PNRs
          </button>
          {showPasteHint && (
            <p className="text-sm text-muted">
              Paste several 10-digit PNRs into the field above, then press Add —
              they will be extracted automatically.
            </p>
          )}

          {pendingPnrs.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted">
                Ready to fetch · {pendingPnrs.length}
              </p>
              <ul className="space-y-1">
                {pendingPnrs.map((pnr) => (
                  <li
                    key={pnr}
                    className="flex items-center justify-between rounded-xl bg-surface-solid/70 px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{maskPnr(pnr)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePendingPnr(pnr)}
                      disabled={isFetching}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                className="pressable w-full"
                onClick={handleFetch}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching live details…
                  </>
                ) : (
                  "Fetch Live Details"
                )}
              </Button>
            </div>
          )}

          {isFetching && fetchQueue.length > 0 && (
            <div className="space-y-2 rounded-xl bg-surface-solid/70 p-3 text-sm">
              {fetchQueue.map((item) => (
                <div key={item.pnr} className="flex items-center gap-2">
                  {item.status === "fetching" && (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  )}
                  {item.status === "success" && (
                    <Badge variant="success">✓</Badge>
                  )}
                  {item.status === "error" && (
                    <Badge variant="warning">✗</Badge>
                  )}
                  <span className="font-mono">{maskPnr(item.pnr)}</span>
                  {item.error && (
                    <span className="text-red-600">{item.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {(trip?.pnrs.length ?? 0) > 0 && (
        <section className="material rounded-2xl p-4 md:p-5">
          <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            Added PNRs · {trip!.pnrs.length}
          </h2>
          <ul className="mt-4 space-y-2">
            {trip!.pnrs.map((pnr) => (
              <li
                key={pnr.id}
                className="flex items-center gap-3 rounded-xl bg-surface-solid/70 px-3 py-2.5 text-sm"
              >
                <Check className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="font-mono font-medium">
                  {pnr.maskedNumber}
                </span>
                <span className="ml-auto text-muted">
                  {coachSummary.get(pnr.id)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePnrFromTrip(pnr.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasConflict && <JourneyConflictPanel />}

      <div className="flex items-center justify-end gap-4 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            clearPendingPnrs();
            setDraftName("");
            if (trip) {
              setAppStep("trips");
            } else {
              clearTrip();
              setAppStep("trips");
            }
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="pressable min-w-[160px]"
          disabled={!canViewMap}
          onClick={() => setAppStep("layout")}
        >
          View Coach Map
        </Button>
      </div>
    </div>
  );
}
