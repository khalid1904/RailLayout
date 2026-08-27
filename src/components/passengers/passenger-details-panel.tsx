"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Passenger } from "@/types/passenger";
import type { PassengerGroup } from "@/types/trip";
import type { Relationship } from "@/types/passenger";
import { formatPassengerBerth } from "@/components/passengers/passenger-list";
import {
  getNearbyPassengers,
  resolveLayoutForPassengers,
  formatBerthType,
} from "@/lib/coach/layout-engine";

const RELATIONSHIPS: Relationship[] = [
  "Self",
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Relative",
  "Friend",
  "Colleague",
  "Other",
];

interface PassengerDetailsPanelProps {
  passenger: Passenger | null;
  allPassengers: Passenger[];
  groups: PassengerGroup[];
  travelClass: string;
  onUpdateMetadata: (
    passengerId: string,
    metadata: Partial<Passenger>
  ) => void;
  onAddGroup: (name: string) => void;
  onSelectPassenger: (id: string) => void;
  /** When true, skip outer material shell (e.g. inside mobile sheet). */
  embedded?: boolean;
}

export function PassengerDetailsPanel({
  passenger,
  allPassengers,
  groups,
  travelClass,
  onUpdateMetadata,
  onAddGroup,
  onSelectPassenger,
  embedded = false,
}: PassengerDetailsPanelProps) {
  const [newGroupName, setNewGroupName] = useState("");

  const shellClass = cn(
    embedded ? "p-4" : "material h-full rounded-2xl p-4 md:p-5"
  );

  if (!passenger) {
    return (
      <section className={shellClass}>
        <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-slate-400">
          Select a passenger to view details
        </div>
      </section>
    );
  }

  const layout = resolveLayoutForPassengers(travelClass, allPassengers);
  const nearby = getNearbyPassengers(passenger, allPassengers, layout);

  const findPassenger = (id: string) =>
    allPassengers.find((p) => p.id === id);

  const renderNearbySection = (title: string, ids: string[]) => {
    if (ids.length === 0) return null;
    return (
      <div>
        <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          {title}
        </p>
        <div className="space-y-1">
          {ids.map((id) => {
            const p = findPassenger(id);
            if (!p) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectPassenger(id)}
                className="pressable block w-full min-h-[48px] rounded-xl bg-white/70 px-3 py-2.5 text-left text-sm hover:bg-white"
              >
                <p className="font-medium text-ink">
                  {p.displayName || p.originalName}
                </p>
                <p className="text-slate-500">{formatPassengerBerth(p)}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <section className={shellClass}>
      <div className="space-y-5">
        <div>
          <p className="text-xs text-slate-500">Original name</p>
          <p className="text-sm text-slate-600">{passenger.originalName}</p>
          <label className="mt-3 block text-xs text-slate-500">
            Display name
          </label>
          <Input
            className="mt-1 font-display text-lg font-semibold tracking-tight"
            placeholder="e.g. Dad"
            value={passenger.displayName ?? ""}
            onChange={(e) =>
              onUpdateMetadata(passenger.id, {
                displayName: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="text-xs text-slate-500">Relationship</label>
          <select
            className="mt-1 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm"
            value={passenger.relationship ?? ""}
            onChange={(e) =>
              onUpdateMetadata(passenger.id, {
                relationship: e.target.value,
              })
            }
          >
            <option value="">Select...</option>
            {RELATIONSHIPS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-500">Group</label>
          <select
            className="mt-1 h-11 w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 text-sm"
            value={passenger.groupId ?? ""}
            onChange={(e) =>
              onUpdateMetadata(passenger.id, {
                groupId: e.target.value || undefined,
              })
            }
          >
            <option value="">None</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex gap-2">
            <Input
              placeholder="New group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="pressable"
              onClick={() => {
                if (newGroupName.trim()) {
                  onAddGroup(newGroupName.trim());
                  setNewGroupName("");
                }
              }}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Coach</p>
            <p className="font-display font-semibold tracking-tight">
              {passenger.coach ?? "Not assigned"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Berth</p>
            <p className="font-display font-semibold tracking-tight">
              {passenger.isAssigned
                ? `${passenger.berthNumber} · ${formatBerthType(passenger.berthType)}`
                : "Not assigned"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">PNR</p>
            <p className="font-mono text-sm">{passenger.maskedPnr}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-sm">{passenger.currentStatus}</p>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-500">Notes</label>
          <Textarea
            className="mt-1"
            placeholder="Optional notes"
            value={passenger.note ?? ""}
            onChange={(e) =>
              onUpdateMetadata(passenger.id, { note: e.target.value })
            }
          />
        </div>

        {passenger.isAssigned && (
          <div className="space-y-4 border-t border-slate-200/60 pt-4">
            <p className="font-display text-sm font-semibold tracking-tight">
              Nearby passengers
            </p>
            {renderNearbySection("Same bay", nearby.sameBay)}
            {renderNearbySection("Nearby", nearby.nearby)}
            {renderNearbySection("Same coach", nearby.sameCoach)}
          </div>
        )}
      </div>
    </section>
  );
}
