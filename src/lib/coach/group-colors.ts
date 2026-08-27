import type { PassengerGroup } from "@/types/trip";

/** Stable palette for passenger groups on the coach map. */
export const GROUP_COLOR_PALETTE = [
  { id: "teal", fill: "rgba(15, 118, 110, 0.22)", border: "#0f766e", swatch: "#0f766e" },
  { id: "amber", fill: "rgba(217, 119, 6, 0.22)", border: "#d97706", swatch: "#d97706" },
  { id: "sky", fill: "rgba(2, 132, 199, 0.22)", border: "#0284c7", swatch: "#0284c7" },
  { id: "rose", fill: "rgba(225, 29, 72, 0.2)", border: "#e11d48", swatch: "#e11d48" },
  { id: "violet", fill: "rgba(124, 58, 237, 0.2)", border: "#7c3aed", swatch: "#7c3aed" },
  { id: "lime", fill: "rgba(101, 163, 13, 0.22)", border: "#65a30d", swatch: "#65a30d" },
] as const;

export const UNGROUPED_COLOR = {
  id: "ungrouped",
  fill: "rgba(15, 118, 110, 0.16)",
  border: "#0f766e",
  swatch: "#14b8a6",
} as const;

export type BerthGroupColor = {
  id: string;
  fill: string;
  border: string;
  swatch: string;
};

export function getGroupColorMap(
  groups: PassengerGroup[]
): Map<string, BerthGroupColor> {
  const map = new Map<string, BerthGroupColor>();
  groups.forEach((g, index) => {
    map.set(
      g.id,
      GROUP_COLOR_PALETTE[index % GROUP_COLOR_PALETTE.length]
    );
  });
  return map;
}

export function resolveOccupantColor(
  groupId: string | undefined | null,
  colorMap: Map<string, BerthGroupColor>
): BerthGroupColor {
  if (groupId && colorMap.has(groupId)) {
    return colorMap.get(groupId)!;
  }
  return UNGROUPED_COLOR;
}
