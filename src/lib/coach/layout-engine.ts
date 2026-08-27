import type { BerthSlot, LayoutDefinition, NearbyPassengers } from "@/types/coach";
import type { BerthType, Passenger } from "@/types/passenger";
import {
  createAC2TierLayout,
  createAC3TierLayout,
  createChairCarLayout,
  createECCLayout,
  createSleeperLayout,
  inferAC2BerthType,
  inferSleeperBerthType,
} from "./layouts";

export function resolveLayout(classCode: string, maxBerth = 0): LayoutDefinition {
  const code = classCode.toUpperCase().trim();
  if (code === "SL" || code.includes("SLEEPER")) {
    return createSleeperLayout("SL", Math.max(72, maxBerth));
  }
  if (code === "3A" || code.includes("3 TIER") || code.includes("3-TIER")) {
    return createAC3TierLayout(Math.max(72, maxBerth));
  }
  if (code === "2A" || code.includes("2 TIER") || code.includes("2-TIER")) {
    return createAC2TierLayout(Math.max(48, maxBerth));
  }
  if (code === "2S" || code.includes("SECOND SITTING")) {
    return createChairCarLayout(Math.max(108, maxBerth), "2S");
  }
  if (code === "CC" || code.includes("CHAIR")) {
    return createChairCarLayout(Math.max(78, maxBerth), "CC");
  }
  if (code === "EC" || code === "EA") return createECCLayout();
  if (code === "1A") return createAC2TierLayout(Math.max(24, maxBerth));
  // High seat numbers usually mean sitting coaches even if class is misreported.
  if (maxBerth > 72) {
    return createChairCarLayout(Math.max(108, maxBerth), code || "2S");
  }
  return createSleeperLayout(code || "SL", Math.max(72, maxBerth));
}

function createFallbackSlot(
  berthNumber: number,
  berthType: BerthType | null | undefined,
  classCode: string
): BerthSlot {
  const code = classCode.toUpperCase();
  const inferred =
    berthType && berthType !== "Other"
      ? berthType
      : code === "2A" || code === "1A"
        ? inferAC2BerthType(berthNumber)
        : code === "CC" || code === "2S" || code === "EC" || code === "EA"
          ? "Seat"
          : inferSleeperBerthType(berthNumber);

  const bayIndex =
    code === "2A" || code === "1A"
      ? Math.floor((berthNumber - 1) / 6)
      : code === "CC" || code === "2S" || code === "EC" || code === "EA"
        ? Math.floor((berthNumber - 1) / 3)
        : Math.floor((berthNumber - 1) / 8);

  return {
    number: berthNumber,
    type: inferred,
    bayIndex,
    row: bayIndex,
    column: 0,
    isSide: inferred === "SideLower" || inferred === "SideUpper",
  };
}

/**
 * Expand a class layout so every live passenger berth number has a visible slot.
 * Indian Railways coaches vary (ICF/LHB, 72 vs 80 berths, 2S seating, etc.).
 */
export function expandLayoutForPassengers(
  layout: LayoutDefinition,
  passengers: Passenger[]
): LayoutDefinition {
  const assigned = passengers.filter(
    (p) => p.isAssigned && p.berthNumber != null
  );
  if (assigned.length === 0) return layout;

  const maxBerth = Math.max(
    layout.totalBerths,
    ...assigned.map((p) => p.berthNumber!)
  );

  // Rebuild from class template sized to the max berth when possible.
  const expanded = resolveLayout(layout.classCode, maxBerth);

  const existing = new Set(expanded.berthSlots.map((s) => s.number));
  const extraSlots: BerthSlot[] = [];

  for (const passenger of assigned) {
    const num = passenger.berthNumber!;
    if (!existing.has(num)) {
      existing.add(num);
      extraSlots.push(
        createFallbackSlot(num, passenger.berthType, expanded.classCode)
      );
    }
  }

  if (extraSlots.length === 0) {
    return {
      ...expanded,
      totalBerths: Math.max(expanded.totalBerths, maxBerth),
    };
  }

  const berthSlots = [...expanded.berthSlots, ...extraSlots].sort(
    (a, b) => a.number - b.number
  );

  return {
    ...expanded,
    totalBerths: Math.max(expanded.totalBerths, maxBerth),
    berthSlots,
  };
}

export function resolveLayoutForPassengers(
  classCode: string,
  passengers: Passenger[]
): LayoutDefinition {
  const maxBerth = passengers.reduce(
    (max, p) =>
      p.isAssigned && p.berthNumber != null
        ? Math.max(max, p.berthNumber)
        : max,
    0
  );
  const base = resolveLayout(classCode || "SL", maxBerth);
  return expandLayoutForPassengers(base, passengers);
}

export function findBerthSlot(
  layout: LayoutDefinition,
  berthNumber: number,
  berthType?: string | null
): BerthSlot | undefined {
  const exact = layout.berthSlots.find((s) => s.number === berthNumber);
  if (exact) return exact;
  if (berthType) {
    return layout.berthSlots.find(
      (s) => s.number === berthNumber && s.type === berthType
    );
  }
  return undefined;
}

export function groupBerthsByBay(
  layout: LayoutDefinition
): Map<number, BerthSlot[]> {
  const bays = new Map<number, BerthSlot[]>();
  for (const slot of layout.berthSlots) {
    const existing = bays.get(slot.bayIndex) ?? [];
    existing.push(slot);
    bays.set(slot.bayIndex, existing);
  }
  return bays;
}

export function getNearbyPassengers(
  selected: Passenger,
  occupants: Passenger[],
  layout: LayoutDefinition
): NearbyPassengers {
  if (!selected.isAssigned || !selected.berthNumber) {
    return { sameBay: [], nearby: [], sameCoach: [] };
  }

  const selectedSlot = findBerthSlot(
    layout,
    selected.berthNumber,
    selected.berthType
  );
  if (!selectedSlot) {
    return {
      sameBay: [],
      nearby: [],
      sameCoach: occupants
        .filter(
          (p) =>
            p.id !== selected.id &&
            p.coach === selected.coach &&
            p.isAssigned
        )
        .map((p) => p.id),
    };
  }

  const sameBay: string[] = [];
  const nearby: string[] = [];
  const sameCoach: string[] = [];

  for (const p of occupants) {
    if (p.id === selected.id || !p.isAssigned || p.coach !== selected.coach) {
      continue;
    }
    const slot = findBerthSlot(layout, p.berthNumber!, p.berthType);
    if (!slot) {
      sameCoach.push(p.id);
      continue;
    }
    if (slot.bayIndex === selectedSlot.bayIndex) {
      sameBay.push(p.id);
    } else if (Math.abs(slot.bayIndex - selectedSlot.bayIndex) === 1) {
      nearby.push(p.id);
    } else {
      sameCoach.push(p.id);
    }
  }

  return { sameBay, nearby, sameCoach };
}

export function groupPassengersByCoach(
  passengers: Passenger[]
): Map<string, Passenger[]> {
  const groups = new Map<string, Passenger[]>();
  for (const p of passengers) {
    const key = p.isAssigned && p.coach ? p.coach : "UNASSIGNED";
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }
  return groups;
}

export function formatBerthType(type: string | null): string {
  if (!type) return "";
  const labels: Record<string, string> = {
    Lower: "Lower",
    Middle: "Middle",
    Upper: "Upper",
    SideLower: "Side Lower",
    SideUpper: "Side Upper",
    Seat: "Seat",
    Other: "Other",
  };
  return labels[type] ?? type;
}

/** Compact IRCTC-style labels for berth tiles. */
export function formatBerthTypeShort(type: string | null): string {
  if (!type) return "";
  const labels: Record<string, string> = {
    Lower: "LOWER",
    Middle: "MIDDLE",
    Upper: "UPPER",
    SideLower: "S.LOWER",
    SideUpper: "S.UPPER",
    Seat: "SEAT",
    Other: "OTHER",
  };
  return labels[type] ?? type.toUpperCase();
}

export function splitBaySlots(slots: BerthSlot[]): {
  main: BerthSlot[];
  side: BerthSlot[];
} {
  const main: BerthSlot[] = [];
  const side: BerthSlot[] = [];
  for (const slot of slots) {
    if (slot.isSide) side.push(slot);
    else main.push(slot);
  }
  main.sort((a, b) => a.number - b.number);
  side.sort((a, b) => a.number - b.number);
  return { main, side };
}

/**
 * Group main berths into visual rows (IRCTC: L/M/U as a row of 3, or L/U as a row of 2).
 */
export function groupMainRows(
  main: BerthSlot[],
  rowSize: number
): BerthSlot[][] {
  const size = Math.max(1, rowSize);
  const rows: BerthSlot[][] = [];
  for (let i = 0; i < main.length; i += size) {
    rows.push(main.slice(i, i + size));
  }
  return rows;
}

/** Main-row width for sleeper-style maps (3 for SL/3A, 2 for 2A/1A). */
export function getMainRowSize(classCode: string): number {
  const code = classCode.toUpperCase().trim();
  if (code === "2A" || code === "1A") return 2;
  return 3;
}

export function isSleeperStyleLayout(classCode: string): boolean {
  const code = classCode.toUpperCase().trim();
  if (code === "CC" || code === "2S" || code === "EC" || code === "EA") {
    return false;
  }
  return true;
}
