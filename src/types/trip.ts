import type { PNRRecord } from "./pnr";
import type { PassengerMetadata } from "./passenger";
import type { Journey } from "./journey";

export interface PassengerGroup {
  id: string;
  name: string;
}

export interface ExportPreferences {
  includeCoachDiagrams: boolean;
  includePassengerList: boolean;
  includeGroups: boolean;
  includeRelationships: boolean;
  includeFullPnr: boolean;
}

export interface Trip {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  journey: Journey;
  pnrs: PNRRecord[];
  groups: PassengerGroup[];
  passengerMetadata: Record<string, PassengerMetadata>;
  exportPreferences: ExportPreferences;
  lastFetchedAt: string | null;
}

export const DEFAULT_EXPORT_PREFERENCES: ExportPreferences = {
  includeCoachDiagrams: true,
  includePassengerList: true,
  includeGroups: true,
  includeRelationships: true,
  includeFullPnr: false,
};
