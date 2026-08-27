"use client";

import type { Passenger } from "@/types/passenger";

interface BerthStatusBannerProps {
  passengers: Passenger[];
  chartStatus: string | null;
}

export function BerthStatusBanner({
  passengers,
  chartStatus,
}: BerthStatusBannerProps) {
  const assigned = passengers.filter((p) => p.isAssigned);
  const unassigned = passengers.filter((p) => !p.isAssigned);

  if (assigned.length === passengers.length) {
    return null;
  }

  const chartNotPrepared =
    chartStatus?.toLowerCase().includes("not prepared") ?? false;

  return (
    <div className="material rounded-2xl border border-amber-200/40 bg-amber-50/45 px-4 py-3.5 text-sm text-amber-950">
      {assigned.length === 0 ? (
        <>
          <p className="font-display font-semibold tracking-tight">
            Berth details not available yet
          </p>
          <p className="mt-1 text-amber-900/85">
            RailRadar returned live status for {passengers.length} passenger
            {passengers.length === 1 ? "" : "s"}, but no coach/berth assignment
            is present in the response.
          </p>
        </>
      ) : (
        <>
          <p className="font-display font-semibold tracking-tight">
            Partial berth assignment ({assigned.length}/{passengers.length})
          </p>
          <p className="mt-1 text-amber-900/85">
            Some passengers have berths; others are still unassigned.
          </p>
        </>
      )}
      {chartNotPrepared && (
        <p className="mt-2 text-amber-800/90">
          Chart is not prepared yet — Indian Railways typically assigns coach
          and berth numbers only after charting.
        </p>
      )}
      {unassigned.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-xl bg-white/60 p-3 font-mono text-xs text-amber-950/80">
          {unassigned.slice(0, 5).map((p) => (
            <li key={p.id}>
              {p.originalName}: {p.currentStatus || "No status"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
