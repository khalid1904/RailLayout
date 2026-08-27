import type { BerthType } from "./passenger";

export interface BerthSlot {
  number: number;
  type: BerthType;
  bayIndex: number;
  row: number;
  column: number;
  isSide: boolean;
}

export interface LayoutDefinition {
  classCode: string;
  label: string;
  totalBerths: number;
  berthSlots: BerthSlot[];
}

export interface CoachGroup {
  coachCode: string;
  passengerCount: number;
  pnrCount: number;
  passengers: string[];
}

export interface NearbyPassengers {
  sameBay: string[];
  nearby: string[];
  sameCoach: string[];
}
