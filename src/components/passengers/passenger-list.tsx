"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { searchPassengers } from "@/lib/trip/groups";
import { formatBerthType } from "@/lib/coach/layout-engine";
import type { Passenger } from "@/types/passenger";
import type { PassengerGroup } from "@/types/trip";

interface PassengerListProps {
  passengers: Passenger[];
  groups: PassengerGroup[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedPassengerId: string | null;
  onSelectPassenger: (id: string) => void;
}

export function PassengerList({
  passengers,
  groups,
  searchQuery,
  onSearchChange,
  selectedPassengerId,
  onSelectPassenger,
}: PassengerListProps) {
  const filtered = useMemo(
    () => searchPassengers(passengers, searchQuery, groups),
    [passengers, searchQuery, groups]
  );

  const grouped = useMemo(() => {
    const groupMap = new Map<string, Passenger[]>();
    const ungrouped: Passenger[] = [];

    for (const p of filtered) {
      if (p.groupId) {
        const list = groupMap.get(p.groupId) ?? [];
        list.push(p);
        groupMap.set(p.groupId, list);
      } else {
        ungrouped.push(p);
      }
    }

    return { groupMap, ungrouped };
  }, [filtered]);

  const renderPassenger = (p: Passenger) => (
    <button
      key={p.id}
      type="button"
      onClick={() => onSelectPassenger(p.id)}
      className={cn(
        "pressable flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        p.id === selectedPassengerId
          ? "bg-teal-50 text-ink ring-1 ring-teal-200/80"
          : "hover:bg-white/70 active:bg-teal-50/70"
      )}
    >
      <span className="truncate font-medium">
        {p.displayName || p.originalName}
      </span>
      <span className="ml-2 shrink-0 text-slate-500">
        {p.isAssigned ? `${p.coach} · ${p.berthNumber}` : "Unassigned"}
      </span>
    </button>
  );

  return (
    <section className="material h-full rounded-2xl p-4">
      <div className="mb-3">
        <h2 className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Passengers · {passengers.length}
        </h2>
        <Input
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-2"
        />
      </div>
      <div className="max-h-[60vh] overflow-y-auto pr-0.5">
        {groups.map((group) => {
          const members = grouped.groupMap.get(group.id);
          if (!members?.length) return null;
          return (
            <div key={group.id} className="mb-4">
              <p className="mb-1.5 font-display text-[11px] font-semibold tracking-tight text-slate-500">
                {group.name}
              </p>
              <div className="space-y-0.5">{members.map(renderPassenger)}</div>
            </div>
          );
        })}
        {grouped.ungrouped.length > 0 && (
          <div>
            {groups.length > 0 && (
              <p className="mb-1.5 font-display text-[11px] font-semibold tracking-tight text-slate-500">
                Ungrouped
              </p>
            )}
            <div className="space-y-0.5">
              {grouped.ungrouped.map(renderPassenger)}
            </div>
          </div>
        )}
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">
            No passengers match your search
          </p>
        )}
      </div>
    </section>
  );
}

export function formatPassengerBerth(p: Passenger): string {
  if (!p.isAssigned) return "Berth not assigned";
  return `${p.coach} · ${p.berthNumber} · ${formatBerthType(p.berthType)}`;
}
