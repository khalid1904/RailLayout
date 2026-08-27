import type { BerthSlot, LayoutDefinition } from "@/types/coach";
import type { BerthType } from "@/types/passenger";

const SL_BAY_TYPES: BerthType[] = [
  "Lower",
  "Middle",
  "Upper",
  "Lower",
  "Middle",
  "Upper",
  "SideLower",
  "SideUpper",
];

const AC2_BAY_TYPES: BerthType[] = [
  "Lower",
  "Upper",
  "Lower",
  "Upper",
  "SideLower",
  "SideUpper",
];

function createSleeperBay(
  bayIndex: number,
  baseNumber: number,
  startRow: number
): BerthSlot[] {
  return SL_BAY_TYPES.map((type, offset) => ({
    number: baseNumber + offset,
    type,
    bayIndex,
    row: startRow + Math.floor(offset / 2),
    column: offset % 2,
    isSide: offset >= 6,
  }));
}

export function createSleeperLayout(
  classCode = "SL",
  berthCount = 72
): LayoutDefinition {
  const bayCount = Math.max(9, Math.ceil(berthCount / 8));
  const berthSlots: BerthSlot[] = [];
  for (let bay = 0; bay < bayCount; bay++) {
    berthSlots.push(...createSleeperBay(bay, bay * 8 + 1, bay * 4));
  }
  return {
    classCode,
    label: classCode === "3A" ? "AC 3-Tier" : "Sleeper",
    totalBerths: bayCount * 8,
    berthSlots,
  };
}

export function createAC3TierLayout(berthCount = 72): LayoutDefinition {
  return {
    ...createSleeperLayout("3A", berthCount),
    label: "AC 3-Tier",
    classCode: "3A",
  };
}

function createAC2Bay(
  bayIndex: number,
  baseNumber: number,
  startRow: number
): BerthSlot[] {
  return AC2_BAY_TYPES.map((type, offset) => ({
    number: baseNumber + offset,
    type,
    bayIndex,
    row: startRow + Math.floor(offset / 2),
    column: offset % 2,
    isSide: offset >= 4,
  }));
}

export function createAC2TierLayout(berthCount = 48): LayoutDefinition {
  const bayCount = Math.max(6, Math.ceil(berthCount / 6));
  const berthSlots: BerthSlot[] = [];
  for (let bay = 0; bay < bayCount; bay++) {
    berthSlots.push(...createAC2Bay(bay, bay * 6 + 1, bay * 3));
  }
  return {
    classCode: "2A",
    label: "AC 2-Tier",
    totalBerths: bayCount * 6,
    berthSlots,
  };
}

export function createChairCarLayout(
  seats = 78,
  classCode = "CC"
): LayoutDefinition {
  const berthSlots: BerthSlot[] = [];
  const seatsPerRow = 3;
  for (let i = 0; i < seats; i++) {
    const row = Math.floor(i / seatsPerRow);
    const column = i % seatsPerRow;
    berthSlots.push({
      number: i + 1,
      type: "Seat",
      bayIndex: row,
      row,
      column,
      isSide: column === 2,
    });
  }
  return {
    classCode,
    label: classCode === "2S" ? "Second Sitting" : "Chair Car",
    totalBerths: seats,
    berthSlots,
  };
}

export function createECCLayout(): LayoutDefinition {
  return createChairCarLayout(56, "EC");
}

/** Infer berth type from number within a sleeper-style bay. */
export function inferSleeperBerthType(berthNumber: number): BerthType {
  return SL_BAY_TYPES[(berthNumber - 1) % 8] ?? "Other";
}

export function inferAC2BerthType(berthNumber: number): BerthType {
  return AC2_BAY_TYPES[(berthNumber - 1) % 6] ?? "Other";
}
