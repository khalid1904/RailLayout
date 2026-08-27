"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripStore } from "@/store/trip-store";
import { TripOverview } from "@/components/trip/trip-overview";
import { JourneyConflictPanel } from "@/components/trip/journey-conflict-panel";
import { PnrInputPanel } from "@/components/pnr/pnr-input-panel";
import { PassengerList } from "@/components/passengers/passenger-list";
import { PassengerDetailsPanel } from "@/components/passengers/passenger-details-panel";
import {
  CoachDiagram,
  UnassignedPassengers,
} from "@/components/coach/coach-diagram";
import {
  CoachSelector,
  getActiveCoach,
} from "@/components/coach/coach-selector";
import { ChangeSummaryDialog } from "@/components/trip/change-summary-dialog";
import { GroupManager } from "@/components/passengers/group-manager";
import { BerthStatusBanner } from "@/components/trip/berth-status-banner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllPassengers } from "@/lib/trip/journey-merge";
import { resolveLayoutForPassengers } from "@/lib/coach/layout-engine";
import { diffPNRRecords } from "@/lib/trip/refresh";
import { useIsMobile } from "@/hooks/use-is-mobile";
import type { PNRRecord } from "@/types/pnr";

async function fetchPNR(pnr: string): Promise<PNRRecord | null> {
  const res = await fetch("/api/pnr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pnr, skipCache: true }),
  });
  const json = await res.json();
  return json.success ? json.data : null;
}

export function TripWorkspace() {
  const {
    trip,
    journeyConflicts,
    selectedPassengerId,
    selectedCoach,
    searchQuery,
    pendingChanges,
    selectPassenger,
    selectCoach,
    setSearchQuery,
    updatePassengerMetadata,
    addGroup,
    renameGroup,
    deleteGroup,
    clearTrip,
    setAppStep,
    refreshTripPnrs,
    applyPendingRefresh,
    dismissPendingChanges,
  } = useTripStore();

  const [refreshing, setRefreshing] = useState(false);
  const isMobile = useIsMobile();

  const passengers = useMemo(
    () => (trip ? getAllPassengers(trip) : []),
    [trip]
  );

  const selectedPassenger = useMemo(
    () => passengers.find((p) => p.id === selectedPassengerId) ?? null,
    [passengers, selectedPassengerId]
  );

  const activeCoach = useMemo(
    () => getActiveCoach(passengers, selectedCoach),
    [passengers, selectedCoach]
  );

  const layout = useMemo(
    () =>
      trip
        ? resolveLayoutForPassengers(
            trip.journey.travelClass || "SL",
            passengers
          )
        : null,
    [trip, passengers]
  );

  const handleRefresh = useCallback(async () => {
    if (!trip || refreshing) return;
    setRefreshing(true);
    try {
      const records: PNRRecord[] = [];
      for (const pnr of trip.pnrs) {
        const data = await fetchPNR(pnr.number);
        if (data) records.push(data);
      }
      if (records.length > 0) {
        const diff = diffPNRRecords(trip.pnrs, records);
        refreshTripPnrs(records, diff);
      }
    } finally {
      setRefreshing(false);
    }
  }, [trip, refreshing, refreshTripPnrs]);

  const handleSelectPassenger = useCallback(
    (id: string) => {
      selectPassenger(id);
      const p = passengers.find((x) => x.id === id);
      if (p?.coach) selectCoach(p.coach);
    },
    [passengers, selectPassenger, selectCoach]
  );

  if (!trip) return null;

  const hasConflict = journeyConflicts.length > 0;

  const toolbar = (
    <>
      <Button
        variant="outline"
        size="sm"
        className="pressable"
        onClick={handleRefresh}
        disabled={refreshing || hasConflict}
      >
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="pressable"
        onClick={() => setAppStep("export")}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="pressable text-muted"
        onClick={() => setAppStep("create")}
      >
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="pressable text-muted"
        onClick={() => {
          if (
            window.confirm(
              "Remove this trip from your list and return to Trips?"
            )
          ) {
            clearTrip();
          }
        }}
      >
        <Trash2 className="h-4 w-4" />
        Clear
      </Button>
    </>
  );

  return (
    <div className="space-y-4 pb-8">
      <TripOverview trip={trip} actions={toolbar} />

      {hasConflict && <JourneyConflictPanel />}

      {!hasConflict && (
        <>
          <BerthStatusBanner
            passengers={passengers}
            chartStatus={trip.pnrs[0]?.chartStatus ?? null}
          />

          <div className="grid items-start gap-4 lg:grid-cols-12">
            <div className="hidden lg:col-span-3 lg:block">
              <PassengerList
                passengers={passengers}
                groups={trip.groups}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedPassengerId={selectedPassengerId}
                onSelectPassenger={handleSelectPassenger}
              />
            </div>

            <div className="lg:col-span-6">
              <section className="material-elevated overflow-hidden rounded-2xl">
                <CoachSelector
                  passengers={passengers}
                  selectedCoach={activeCoach}
                  onSelectCoach={selectCoach}
                />

                {layout ? (
                  activeCoach ? (
                    <CoachDiagram
                      layout={layout}
                      passengers={passengers}
                      coachCode={activeCoach}
                      groups={trip.groups}
                      selectedPassengerId={selectedPassengerId}
                      onSelectPassenger={handleSelectPassenger}
                    />
                  ) : (
                    <div className="space-y-4 p-4">
                      <p className="rounded-xl bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                        Coach not assigned yet. Berth positions will appear
                        here after chart preparation.
                      </p>
                      <CoachDiagram
                        layout={layout}
                        passengers={passengers}
                        coachCode="__NONE__"
                        groups={trip.groups}
                        selectedPassengerId={selectedPassengerId}
                        onSelectPassenger={handleSelectPassenger}
                      />
                    </div>
                  )
                ) : (
                  <p className="py-8 text-center text-slate-400">
                    Unable to determine coach layout for this class.
                  </p>
                )}
              </section>

              <div className="mt-4">
                <UnassignedPassengers
                  passengers={passengers}
                  selectedPassengerId={selectedPassengerId}
                  onSelectPassenger={handleSelectPassenger}
                />
              </div>
            </div>

            <div className="hidden lg:col-span-3 lg:block">
              <PassengerDetailsPanel
                passenger={selectedPassenger}
                allPassengers={passengers}
                groups={trip.groups}
                travelClass={trip.journey.travelClass}
                onUpdateMetadata={updatePassengerMetadata}
                onAddGroup={addGroup}
                onSelectPassenger={handleSelectPassenger}
              />
            </div>
          </div>

          {/* Mobile: list + bottom sheet for details */}
          <div className="space-y-4 lg:hidden">
            <PassengerList
              passengers={passengers}
              groups={trip.groups}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedPassengerId={selectedPassengerId}
              onSelectPassenger={handleSelectPassenger}
            />
          </div>

          <Dialog
            open={isMobile && Boolean(selectedPassenger)}
            onOpenChange={(open) => {
              if (!open) selectPassenger(null);
            }}
          >
            <DialogContent className="material-elevated fixed inset-x-0 bottom-0 top-auto max-h-[85vh] w-full max-w-none translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none border-0 p-0 data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100">
              <DialogHeader className="sr-only">
                <DialogTitle>Passenger details</DialogTitle>
              </DialogHeader>
              <div className="max-h-[85vh] overflow-y-auto px-1 pb-6 pt-2">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
                <PassengerDetailsPanel
                  passenger={selectedPassenger}
                  allPassengers={passengers}
                  groups={trip.groups}
                  travelClass={trip.journey.travelClass}
                  onUpdateMetadata={updatePassengerMetadata}
                  onAddGroup={addGroup}
                  onSelectPassenger={handleSelectPassenger}
                  embedded
                />
              </div>
            </DialogContent>
          </Dialog>

          <div className="grid gap-4 md:grid-cols-2 md:max-w-3xl">
            <GroupManager
              groups={trip.groups}
              onAdd={addGroup}
              onRename={renameGroup}
              onDelete={deleteGroup}
            />
            <PnrInputPanel />
          </div>
        </>
      )}

      <ChangeSummaryDialog
        diff={pendingChanges}
        open={Boolean(pendingChanges?.hasChanges)}
        onApply={applyPendingRefresh}
        onDismiss={dismissPendingChanges}
      />
    </div>
  );
}
