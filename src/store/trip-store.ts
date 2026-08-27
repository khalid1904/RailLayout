"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type { Trip, ExportPreferences } from "@/types/trip";
import { DEFAULT_EXPORT_PREFERENCES } from "@/types/trip";
import type { PNRRecord } from "@/types/pnr";
import type { PassengerMetadata } from "@/types/passenger";
import type { RefreshDiff } from "@/lib/trip/refresh";
import { mergeMetadata } from "@/lib/trip/refresh";
import { mergePNRs } from "@/lib/trip/journey-merge";
import type { JourneyConflict } from "@/lib/trip/journey-merge";
import { sanitizeUserText } from "@/lib/privacy/mask-pnr";

export type FetchStatus = "idle" | "fetching" | "success" | "error";
export type AppStep =
  | "dashboard"
  | "trips"
  | "create"
  | "layout"
  | "export";

export interface PendingPNR {
  pnr: string;
  status: "pending" | "fetching" | "success" | "error";
  error?: string;
}

interface TripState {
  trips: Trip[];
  activeTripId: string | null;
  /** Active trip mirror for consumers */
  trip: Trip | null;
  appStep: AppStep;
  pendingPnrs: string[];
  fetchQueue: PendingPNR[];
  selectedPassengerId: string | null;
  selectedCoach: string | null;
  searchQuery: string;
  pendingChanges: RefreshDiff | null;
  pendingRefreshPnrs: PNRRecord[] | null;
  journeyConflicts: JourneyConflict[];

  setAppStep: (step: AppStep) => void;
  openTrip: (id: string) => void;
  editTrip: (id: string) => void;
  createNewTripDraft: () => void;
  deleteTrip: (id: string) => void;
  updateTripName: (name: string) => void;

  addPendingPnr: (pnr: string) => void;
  addPendingPnrs: (pnrs: string[]) => void;
  removePendingPnr: (pnr: string) => void;
  clearPendingPnrs: () => void;
  setFetchQueue: (queue: PendingPNR[]) => void;
  updateFetchQueueItem: (pnr: string, update: Partial<PendingPNR>) => void;

  setTripFromPnrs: (pnrs: PNRRecord[]) => void;
  addPnrsToTrip: (pnrs: PNRRecord[]) => void;
  removePnrFromTrip: (pnrId: string) => void;
  clearTrip: () => void;
  refreshTripPnrs: (pnrs: PNRRecord[], diff: RefreshDiff) => void;
  applyPendingRefresh: () => void;
  dismissPendingChanges: () => void;

  selectPassenger: (id: string | null) => void;
  selectCoach: (coach: string | null) => void;
  setSearchQuery: (q: string) => void;

  updatePassengerMetadata: (
    passengerId: string,
    metadata: Partial<PassengerMetadata>
  ) => void;
  addGroup: (name: string) => void;
  renameGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  updateExportPreferences: (prefs: Partial<ExportPreferences>) => void;
}

function createEmptyTrip(pnrs: PNRRecord[]): Trip {
  const merge = mergePNRs(pnrs);
  const allPassengers = pnrs.flatMap((p) => p.passengers);
  const metadata = mergeMetadata({}, allPassengers);

  return {
    id: uuidv4(),
    name: merge.journey?.trainName ?? "My Trip",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    journey: merge.journey!,
    pnrs,
    groups: [],
    passengerMetadata: metadata,
    exportPreferences: DEFAULT_EXPORT_PREFERENCES,
    lastFetchedAt: new Date().toISOString(),
  };
}

function upsertTrip(trips: Trip[], trip: Trip): Trip[] {
  const idx = trips.findIndex((t) => t.id === trip.id);
  if (idx === -1) return [...trips, trip];
  const next = [...trips];
  next[idx] = trip;
  return next;
}

function commitActive(trips: Trip[], trip: Trip | null) {
  if (!trip) {
    return {
      trips,
      trip: null as Trip | null,
      activeTripId: null as string | null,
    };
  }
  return {
    trips: upsertTrip(trips, trip),
    trip,
    activeTripId: trip.id,
  };
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      trips: [],
      activeTripId: null,
      trip: null,
      appStep: "dashboard",
      pendingPnrs: [],
      fetchQueue: [],
      selectedPassengerId: null,
      selectedCoach: null,
      searchQuery: "",
      pendingChanges: null,
      pendingRefreshPnrs: null,
      journeyConflicts: [],

      setAppStep: (step) => set({ appStep: step }),

      openTrip: (id) => {
        const found = get().trips.find((t) => t.id === id) ?? null;
        if (!found) return;
        set({
          ...commitActive(get().trips, found),
          appStep: "layout",
          selectedPassengerId: null,
          selectedCoach: null,
          searchQuery: "",
          pendingChanges: null,
          pendingRefreshPnrs: null,
          journeyConflicts: [],
          pendingPnrs: [],
          fetchQueue: [],
        });
      },

      editTrip: (id) => {
        const found = get().trips.find((t) => t.id === id) ?? null;
        if (!found) return;
        set({
          ...commitActive(get().trips, found),
          appStep: "create",
          pendingPnrs: [],
          fetchQueue: [],
          selectedPassengerId: null,
          selectedCoach: null,
          pendingChanges: null,
          pendingRefreshPnrs: null,
          journeyConflicts: [],
        });
      },

      createNewTripDraft: () => {
        set({
          trip: null,
          activeTripId: null,
          appStep: "create",
          pendingPnrs: [],
          fetchQueue: [],
          selectedPassengerId: null,
          selectedCoach: null,
          searchQuery: "",
          pendingChanges: null,
          pendingRefreshPnrs: null,
          journeyConflicts: [],
        });
      },

      deleteTrip: (id) => {
        const trips = get().trips.filter((t) => t.id !== id);
        const wasActive = get().activeTripId === id;
        set({
          trips,
          ...(wasActive
            ? {
                trip: null,
                activeTripId: null,
                appStep: "trips" as AppStep,
                pendingPnrs: [],
                fetchQueue: [],
                selectedPassengerId: null,
                selectedCoach: null,
                pendingChanges: null,
                pendingRefreshPnrs: null,
                journeyConflicts: [],
              }
            : {}),
        });
      },

      updateTripName: (name) => {
        const { trip, trips } = get();
        if (!trip) return;
        const updated = {
          ...trip,
          name: sanitizeUserText(name, 120) || trip.name,
          updatedAt: new Date().toISOString(),
        };
        set(commitActive(trips, updated));
      },

      addPendingPnr: (pnr) => {
        const { pendingPnrs } = get();
        if (!pendingPnrs.includes(pnr)) {
          set({ pendingPnrs: [...pendingPnrs, pnr] });
        }
      },

      addPendingPnrs: (pnrs) => {
        const existing = new Set(get().pendingPnrs);
        for (const p of pnrs) existing.add(p);
        set({ pendingPnrs: [...existing] });
      },

      removePendingPnr: (pnr) => {
        set({
          pendingPnrs: get().pendingPnrs.filter((p) => p !== pnr),
          fetchQueue: get().fetchQueue.filter((q) => q.pnr !== pnr),
        });
      },

      clearPendingPnrs: () => set({ pendingPnrs: [], fetchQueue: [] }),

      setFetchQueue: (queue) => set({ fetchQueue: queue }),

      updateFetchQueueItem: (pnr, update) => {
        set({
          fetchQueue: get().fetchQueue.map((q) =>
            q.pnr === pnr ? { ...q, ...update } : q
          ),
        });
      },

      setTripFromPnrs: (pnrs) => {
        const merge = mergePNRs(pnrs);
        const created = createEmptyTrip(pnrs);
        set({
          ...commitActive(get().trips, created),
          journeyConflicts: merge.conflicts,
          pendingPnrs: [],
          fetchQueue: [],
          selectedCoach: null,
          selectedPassengerId: null,
        });
      },

      addPnrsToTrip: (newPnrs) => {
        const { trip, trips } = get();
        if (!trip) {
          get().setTripFromPnrs(newPnrs);
          return;
        }
        const combined = [...trip.pnrs, ...newPnrs];
        const merge = mergePNRs(combined);
        const allPassengers = combined.flatMap((p) => p.passengers);
        const updated: Trip = {
          ...trip,
          pnrs: combined,
          journey: merge.journey ?? trip.journey,
          passengerMetadata: mergeMetadata(
            trip.passengerMetadata,
            allPassengers
          ),
          updatedAt: new Date().toISOString(),
          lastFetchedAt: new Date().toISOString(),
        };
        set({
          ...commitActive(trips, updated),
          journeyConflicts: merge.conflicts,
        });
      },

      removePnrFromTrip: (pnrId) => {
        const { trip, trips } = get();
        if (!trip) return;
        const remaining = trip.pnrs.filter((p) => p.id !== pnrId);
        if (remaining.length === 0) {
          const nextTrips = trips.filter((t) => t.id !== trip.id);
          set({
            trips: nextTrips,
            trip: null,
            activeTripId: null,
            journeyConflicts: [],
          });
          return;
        }
        const merge = mergePNRs(remaining);
        const allPassengers = remaining.flatMap((p) => p.passengers);
        const updated: Trip = {
          ...trip,
          pnrs: remaining,
          journey: merge.journey ?? trip.journey,
          passengerMetadata: mergeMetadata(
            trip.passengerMetadata,
            allPassengers
          ),
          updatedAt: new Date().toISOString(),
        };
        set({
          ...commitActive(trips, updated),
          journeyConflicts: merge.conflicts,
        });
      },

      clearTrip: () => {
        const { trip, trips } = get();
        const nextTrips = trip
          ? trips.filter((t) => t.id !== trip.id)
          : trips;
        set({
          trips: nextTrips,
          trip: null,
          activeTripId: null,
          appStep: "trips",
          pendingPnrs: [],
          fetchQueue: [],
          selectedPassengerId: null,
          selectedCoach: null,
          searchQuery: "",
          pendingChanges: null,
          pendingRefreshPnrs: null,
          journeyConflicts: [],
        });
      },

      refreshTripPnrs: (pnrs, diff) => {
        const { trip, trips } = get();
        if (!trip) return;
        const allPassengers = pnrs.flatMap((p) => p.passengers);
        if (diff.hasChanges) {
          set({
            pendingChanges: diff,
            pendingRefreshPnrs: pnrs,
          });
          return;
        }
        const updated: Trip = {
          ...trip,
          pnrs,
          passengerMetadata: mergeMetadata(
            trip.passengerMetadata,
            allPassengers
          ),
          updatedAt: new Date().toISOString(),
          lastFetchedAt: new Date().toISOString(),
        };
        set({
          pendingChanges: null,
          pendingRefreshPnrs: null,
          ...commitActive(trips, updated),
        });
      },

      applyPendingRefresh: () => {
        const { trip, trips, pendingRefreshPnrs } = get();
        if (!trip || !pendingRefreshPnrs) return;
        const allPassengers = pendingRefreshPnrs.flatMap((p) => p.passengers);
        const updated: Trip = {
          ...trip,
          pnrs: pendingRefreshPnrs,
          passengerMetadata: mergeMetadata(
            trip.passengerMetadata,
            allPassengers
          ),
          updatedAt: new Date().toISOString(),
          lastFetchedAt: new Date().toISOString(),
        };
        set({
          ...commitActive(trips, updated),
          pendingChanges: null,
          pendingRefreshPnrs: null,
        });
      },

      dismissPendingChanges: () => {
        set({ pendingChanges: null, pendingRefreshPnrs: null });
      },

      selectPassenger: (id) => set({ selectedPassengerId: id }),
      selectCoach: (coach) => set({ selectedCoach: coach }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      updatePassengerMetadata: (passengerId, metadata) => {
        const { trip, trips } = get();
        if (!trip) return;
        const existing = trip.passengerMetadata[passengerId] ?? {};
        const updatedMeta: PassengerMetadata = { ...existing };
        if (metadata.displayName !== undefined) {
          updatedMeta.displayName = sanitizeUserText(metadata.displayName, 100);
        }
        if (metadata.relationship !== undefined) {
          updatedMeta.relationship = sanitizeUserText(
            String(metadata.relationship),
            50
          );
        }
        if (metadata.groupId !== undefined) {
          updatedMeta.groupId = metadata.groupId;
        }
        if (metadata.note !== undefined) {
          updatedMeta.note = sanitizeUserText(metadata.note, 500);
        }
        const updated: Trip = {
          ...trip,
          passengerMetadata: {
            ...trip.passengerMetadata,
            [passengerId]: updatedMeta,
          },
          updatedAt: new Date().toISOString(),
        };
        set(commitActive(trips, updated));
      },

      addGroup: (name) => {
        const { trip, trips } = get();
        if (!trip) return;
        const group = { id: uuidv4(), name: sanitizeUserText(name, 50) };
        const updated: Trip = {
          ...trip,
          groups: [...trip.groups, group],
          updatedAt: new Date().toISOString(),
        };
        set(commitActive(trips, updated));
      },

      renameGroup: (groupId, name) => {
        const { trip, trips } = get();
        if (!trip) return;
        const updated: Trip = {
          ...trip,
          groups: trip.groups.map((g) =>
            g.id === groupId
              ? { ...g, name: sanitizeUserText(name, 50) }
              : g
          ),
          updatedAt: new Date().toISOString(),
        };
        set(commitActive(trips, updated));
      },

      deleteGroup: (groupId) => {
        const { trip, trips } = get();
        if (!trip) return;
        const metadata = { ...trip.passengerMetadata };
        for (const [id, meta] of Object.entries(metadata)) {
          if (meta.groupId === groupId) {
            metadata[id] = { ...meta, groupId: undefined };
          }
        }
        const updated: Trip = {
          ...trip,
          groups: trip.groups.filter((g) => g.id !== groupId),
          passengerMetadata: metadata,
          updatedAt: new Date().toISOString(),
        };
        set(commitActive(trips, updated));
      },

      updateExportPreferences: (prefs) => {
        const { trip, trips } = get();
        if (!trip) return;
        const updated: Trip = {
          ...trip,
          exportPreferences: { ...trip.exportPreferences, ...prefs },
        };
        set(commitActive(trips, updated));
      },
    }),
    {
      name: "train-coach-planner",
      partialize: (state) => ({
        trips: state.trips,
        activeTripId: state.activeTripId,
        appStep: state.appStep,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<TripState> & { trip?: Trip | null };
        let trips = p.trips ?? current.trips;
        let activeTripId = p.activeTripId ?? current.activeTripId;

        // Migrate legacy single-trip persist
        if ((!trips || trips.length === 0) && p.trip) {
          trips = [p.trip];
          activeTripId = p.trip.id;
        }

        const trip =
          trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;

        let appStep = (p.appStep as AppStep | undefined) ?? current.appStep;
        if (appStep === ("create" as AppStep) && !trip && trips.length === 0) {
          appStep = "dashboard";
        }
        // Legacy create-only default → dashboard when empty
        if (!p.trips && !p.trip && appStep === "create") {
          appStep = "dashboard";
        }

        return {
          ...current,
          ...p,
          trips,
          activeTripId: trip?.id ?? null,
          trip,
          appStep,
        };
      },
    }
  )
);
