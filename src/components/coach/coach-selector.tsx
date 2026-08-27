"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { springUI, fadeTransition, usePrefersReducedMotion } from "@/lib/motion";
import { groupPassengersByCoach } from "@/lib/coach/layout-engine";
import type { Passenger } from "@/types/passenger";

interface CoachSelectorProps {
  passengers: Passenger[];
  selectedCoach: string | null;
  onSelectCoach: (coach: string) => void;
}

function CoachGlyph({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 40 28" className="h-7 w-10" aria-hidden>
      <rect
        x="2"
        y="4"
        width="36"
        height="18"
        rx="3"
        className={active ? "fill-teal-500" : "fill-teal-600/70"}
      />
      <rect
        x="2"
        y="16"
        width="36"
        height="6"
        rx="1"
        className="fill-teal-800/80"
      />
      <rect x="6" y="7" width="6" height="5" rx="0.5" className="fill-white/35" />
      <rect x="14" y="7" width="6" height="5" rx="0.5" className="fill-white/35" />
      <rect x="22" y="7" width="6" height="5" rx="0.5" className="fill-white/35" />
      <rect x="30" y="7" width="4" height="5" rx="0.5" className="fill-white/35" />
      <circle cx="10" cy="24" r="2" className="fill-slate-400" />
      <circle cx="30" cy="24" r="2" className="fill-slate-400" />
    </svg>
  );
}

export function CoachSelector({
  passengers,
  selectedCoach,
  onSelectCoach,
}: CoachSelectorProps) {
  const groups = groupPassengersByCoach(passengers);
  const coaches = Array.from(groups.entries())
    .filter(([code]) => code !== "UNASSIGNED")
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  const reducedMotion = usePrefersReducedMotion();
  const activeRef = useRef<HTMLButtonElement>(null);
  const activeCoach = selectedCoach ?? coaches[0]?.[0] ?? null;

  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeCoach, reducedMotion]);

  if (coaches.length === 0) return null;

  return (
    <div className="rounded-t-2xl bg-surface-solid/50">
      <div
        role="tablist"
        aria-label="Coach"
        className="flex gap-1 overflow-x-auto px-2 pb-2 pt-3"
      >
        {coaches.map(([code, list]) => {
          const active = activeCoach === code;
          return (
            <button
              key={code}
              ref={active ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectCoach(code)}
              className="pressable relative flex min-w-[56px] shrink-0 flex-col items-center gap-1 px-2 py-1"
            >
              <span
                className={cn(
                  "text-xs font-semibold tracking-wide",
                  active ? "text-ink" : "text-muted"
                )}
              >
                {code}
              </span>
              <div className="relative">
                <CoachGlyph active={active} />
                {list.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--surface-solid)]" />
                )}
              </div>
              <span className="relative flex h-7 w-7 items-center justify-center">
                {active && (
                  <motion.span
                    layoutId="coach-index-pill"
                    className="absolute inset-0 rounded-full bg-accent"
                    transition={reducedMotion ? fadeTransition : springUI}
                  />
                )}
                <span
                  className={cn(
                    "relative z-[1] text-xs font-bold",
                    active ? "text-white" : "text-muted"
                  )}
                >
                  {list.length}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-teal-600/40 to-transparent"
        aria-hidden
      />
    </div>
  );
}

export function getActiveCoach(
  passengers: Passenger[],
  selectedCoach: string | null
): string | null {
  const groups = groupPassengersByCoach(passengers);
  const coaches = Array.from(groups.keys()).filter((c) => c !== "UNASSIGNED");
  if (coaches.length === 0) return null;
  if (selectedCoach && coaches.includes(selectedCoach)) return selectedCoach;
  return coaches.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  )[0];
}
