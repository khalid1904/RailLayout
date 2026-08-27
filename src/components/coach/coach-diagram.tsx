"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { BerthSlot, LayoutDefinition } from "@/types/coach";
import type { Passenger } from "@/types/passenger";
import {
  formatBerthTypeShort,
  getMainRowSize,
  groupBerthsByBay,
  groupMainRows,
  isSleeperStyleLayout,
  splitBaySlots,
} from "@/lib/coach/layout-engine";
import { BerthCard } from "./berth-card";
import {
  getGroupColorMap,
  resolveOccupantColor,
  UNGROUPED_COLOR,
} from "@/lib/coach/group-colors";
import type { PassengerGroup } from "@/types/trip";
import type { BerthGroupColor } from "@/lib/coach/group-colors";

interface CoachDiagramProps {
  layout: LayoutDefinition;
  passengers: Passenger[];
  coachCode: string;
  groups?: PassengerGroup[];
  selectedPassengerId?: string | null;
  onSelectPassenger?: (id: string) => void;
}

function renderBerth(
  slot: BerthSlot,
  occupantMap: Map<number, Passenger>,
  selectedPassengerId: string | null | undefined,
  onSelectPassenger: ((id: string) => void) | undefined,
  colorMap: Map<string, BerthGroupColor>,
  compact?: boolean
) {
  const occupant = occupantMap.get(slot.number);
  const groupColor = occupant
    ? resolveOccupantColor(occupant.groupId, colorMap)
    : null;
  return (
    <BerthCard
      key={`${slot.number}-${slot.type}`}
      slot={slot}
      occupant={occupant}
      selected={occupant?.id === selectedPassengerId}
      compact={compact}
      groupColor={groupColor}
      onSelect={() => occupant && onSelectPassenger?.(occupant.id)}
    />
  );
}

export function CoachDiagram({
  layout,
  passengers,
  coachCode,
  groups = [],
  selectedPassengerId,
  onSelectPassenger,
}: CoachDiagramProps) {
  const occupantMap = useMemo(() => {
    const map = new Map<number, Passenger>();
    for (const p of passengers) {
      if (p.coach === coachCode && p.berthNumber) {
        map.set(p.berthNumber, p);
      }
    }
    return map;
  }, [passengers, coachCode]);

  const colorMap = useMemo(() => getGroupColorMap(groups), [groups]);

  const hasOccupiedUngrouped = useMemo(
    () =>
      passengers.some(
        (p) =>
          p.coach === coachCode && p.isAssigned && !p.groupId
      ),
    [passengers, coachCode]
  );

  const bays = useMemo(() => groupBerthsByBay(layout), [layout]);
  const sleeperStyle = isSleeperStyleLayout(layout.classCode);
  const rowSize = getMainRowSize(layout.classCode);

  const layoutNumbers = useMemo(
    () => new Set(layout.berthSlots.map((s) => s.number)),
    [layout]
  );

  const overflowPassengers = useMemo(
    () =>
      passengers.filter(
        (p) =>
          p.coach === coachCode &&
          p.isAssigned &&
          p.berthNumber != null &&
          !layoutNumbers.has(p.berthNumber)
      ),
    [passengers, coachCode, layoutNumbers]
  );

  return (
    <div className="space-y-4">
      {(groups.length > 0 || hasOccupiedUngrouped) && (
        <div className="flex flex-wrap items-center gap-3 px-1">
          {groups.map((g) => {
            const color = colorMap.get(g.id) ?? UNGROUPED_COLOR;
            return (
              <span
                key={g.id}
                className="inline-flex items-center gap-1.5 text-xs text-muted"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color.swatch }}
                />
                {g.name}
              </span>
            );
          })}
          {hasOccupiedUngrouped && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: UNGROUPED_COLOR.swatch }}
              />
              Ungrouped
            </span>
          )}
        </div>
      )}
      <div className="rounded-b-2xl bg-surface-solid/40">
        <div className="max-h-[min(70vh,720px)] overflow-y-auto px-3 py-4 sm:px-4">
          {sleeperStyle ? (
            <div className="mx-auto w-full max-w-lg space-y-3">
              {Array.from(bays.entries()).map(([bayIndex, slots]) => {
                const { main, side } = splitBaySlots(slots);
                const rows = groupMainRows(main, rowSize);

                return (
                  <div
                    key={bayIndex}
                    className="space-y-2 rounded-xl border p-2 sm:p-2.5 [background:var(--berth-occupied-bg)] [border-color:var(--bay-frame)]"
                  >
                    {rows.map((row, rowIndex) => (
                      <div
                        key={`${bayIndex}-${rowIndex}`}
                        className="grid grid-cols-[1fr_10px_auto] items-center gap-2 sm:gap-3"
                      >
                        <div
                          className={cn(
                            "grid gap-2",
                            rowSize === 2 ? "grid-cols-2" : "grid-cols-3"
                          )}
                        >
                          {row.map((slot) =>
                            renderBerth(
                              slot,
                              occupantMap,
                              selectedPassengerId,
                              onSelectPassenger,
                              colorMap
                            )
                          )}
                        </div>

                        <div
                          className="h-full min-h-[72px] rounded-full [background:var(--berth-aisle)]"
                          aria-hidden
                          title="Aisle"
                        />

                        <div className="flex justify-center">
                          {side[rowIndex] ? (
                            renderBerth(
                              side[rowIndex],
                              occupantMap,
                              selectedPassengerId,
                              onSelectPassenger,
                              colorMap,
                              true
                            )
                          ) : (
                            <div className="min-h-[72px] min-w-[64px]" />
                          )}
                        </div>
                      </div>
                    ))}
                    {side.length > rows.length && (
                      <div className="flex justify-end gap-2">
                        {side.slice(rows.length).map((slot) =>
                          renderBerth(
                            slot,
                            occupantMap,
                            selectedPassengerId,
                            onSelectPassenger,
                            colorMap,
                            true
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 sm:grid-cols-4">
              {layout.berthSlots.map((slot) =>
                renderBerth(
                  slot,
                  occupantMap,
                  selectedPassengerId,
                  onSelectPassenger,
                  colorMap
                )
              )}
            </div>
          )}
        </div>
      </div>

      {overflowPassengers.length > 0 && (
        <div className="material rounded-2xl border border-teal-200/40 bg-teal-50/40 p-3.5">
          <p className="mb-2.5 font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
            Additional seats in this coach
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {overflowPassengers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPassenger?.(p.id)}
                className={cn(
                  "pressable min-h-[72px] rounded-xl border border-white/60 bg-white/90 p-2.5 text-left shadow-sm",
                  p.id === selectedPassengerId &&
                    "ring-2 ring-teal-600/80 ring-offset-2"
                )}
              >
                <div className="flex items-baseline justify-between gap-1">
                  <span className="font-display text-lg font-semibold tracking-tight">
                    {p.berthNumber}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-slate-500">
                    {formatBerthTypeShort(p.berthType)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-medium">
                  {p.displayName || p.originalName}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UnassignedPassengersProps {
  passengers: Passenger[];
  selectedPassengerId?: string | null;
  onSelectPassenger?: (id: string) => void;
}

export function UnassignedPassengers({
  passengers,
  selectedPassengerId,
  onSelectPassenger,
}: UnassignedPassengersProps) {
  const unassigned = passengers.filter((p) => !p.isAssigned);
  if (unassigned.length === 0) return null;

  return (
    <div className="material rounded-2xl border border-amber-200/40 bg-amber-50/50 p-4">
      <h3 className="mb-3 font-display text-sm font-semibold tracking-tight text-amber-950">
        Berth not assigned ({unassigned.length})
      </h3>
      <div className="space-y-2">
        {unassigned.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPassenger?.(p.id)}
            className={cn(
              "pressable w-full rounded-xl border border-white/70 bg-white/90 p-3 text-left text-sm",
              p.id === selectedPassengerId &&
                "ring-2 ring-teal-600/80 ring-offset-2"
            )}
          >
            <p className="font-medium text-ink">
              {p.displayName || p.originalName}
            </p>
            <p className="text-slate-500">{p.currentStatus}</p>
            <p className="font-mono text-xs text-slate-400">{p.maskedPnr}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
