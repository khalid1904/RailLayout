"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { springUI, fadeTransition, usePrefersReducedMotion } from "@/lib/motion";
import type { BerthSlot } from "@/types/coach";
import type { Passenger } from "@/types/passenger";
import { formatBerthTypeShort } from "@/lib/coach/layout-engine";
import type { BerthGroupColor } from "@/lib/coach/group-colors";

interface BerthCardProps {
  slot: BerthSlot;
  occupant?: Passenger;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
  groupColor?: BerthGroupColor | null;
}

export function BerthCard({
  slot,
  occupant,
  selected,
  onSelect,
  compact = false,
  groupColor = null,
}: BerthCardProps) {
  const isEmpty = !occupant;
  const displayName = occupant?.displayName || occupant?.originalName;
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!selected || !ref.current) return;
    ref.current.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [selected, reducedMotion]);

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={onSelect}
      disabled={!occupant}
      whileTap={occupant && !reducedMotion ? { scale: 0.97 } : undefined}
      animate={selected ? { scale: reducedMotion ? 1 : 1.02 } : { scale: 1 }}
      transition={reducedMotion ? fadeTransition : springUI}
      title={
        occupant
          ? `${displayName} · ${occupant.maskedPnr}`
          : `Berth ${slot.number}`
      }
      style={
        !isEmpty && groupColor
          ? {
              backgroundColor: groupColor.fill,
              borderColor: groupColor.border,
            }
          : undefined
      }
      className={cn(
        "pressable flex flex-col rounded-xl border text-left",
        compact
          ? "min-h-[72px] min-w-[64px] px-1.5 py-1.5"
          : "min-h-[80px] px-2 py-2",
        isEmpty &&
          "cursor-default border-dashed text-muted [background:var(--berth-empty-bg)] [border-color:var(--berth-empty-border)]",
        !isEmpty &&
          !selected &&
          !groupColor &&
          "cursor-pointer text-ink hover:border-accent [background:var(--berth-occupied-bg)] [border-color:var(--border)]",
        !isEmpty && !selected && groupColor && "cursor-pointer text-ink",
        selected &&
          "z-[1] cursor-pointer ring-2 ring-accent/80 ring-offset-2 ring-offset-[var(--background)]"
      )}
    >
      <div className="flex items-baseline justify-between gap-1">
        <span className="font-display text-base font-semibold tracking-tight text-ink sm:text-lg">
          {slot.number}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-muted sm:text-[10px]">
          {formatBerthTypeShort(slot.type)}
        </span>
      </div>
      <p
        className={cn(
          "mt-1 line-clamp-2 text-xs font-medium leading-snug sm:text-sm",
          isEmpty ? "text-muted" : "text-ink"
        )}
      >
        {isEmpty ? "Available" : displayName}
      </p>
    </motion.button>
  );
}
