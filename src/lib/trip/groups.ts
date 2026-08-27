import { v4 as uuidv4 } from "uuid";
import type { PassengerGroup } from "@/types/trip";

export function createGroup(name: string): PassengerGroup {
  return { id: uuidv4(), name: name.trim() };
}

export function renameGroup(
  groups: PassengerGroup[],
  groupId: string,
  name: string
): PassengerGroup[] {
  return groups.map((g) =>
    g.id === groupId ? { ...g, name: name.trim() } : g
  );
}

export function deleteGroup(
  groups: PassengerGroup[],
  groupId: string
): PassengerGroup[] {
  return groups.filter((g) => g.id !== groupId);
}

export function searchPassengers<
  T extends {
    originalName: string;
    displayName?: string;
    coach: string | null;
    berthNumber: number | null;
    maskedPnr: string;
    groupId?: string;
  }
>(
  passengers: T[],
  query: string,
  groups: PassengerGroup[]
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return passengers;

  const groupMap = new Map(groups.map((g) => [g.id, g.name.toLowerCase()]));

  return passengers.filter((p) => {
    const groupName = p.groupId ? groupMap.get(p.groupId) ?? "" : "";
    return (
      p.originalName.toLowerCase().includes(q) ||
      (p.displayName?.toLowerCase().includes(q) ?? false) ||
      (p.coach?.toLowerCase().includes(q) ?? false) ||
      (p.berthNumber?.toString().includes(q) ?? false) ||
      p.maskedPnr.includes(q) ||
      groupName.includes(q)
    );
  });
}
