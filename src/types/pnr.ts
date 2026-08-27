import type { Journey } from "./journey";
import type { Passenger } from "./passenger";

export type PNRStatus = "Confirmed" | "RAC" | "Waitlisted" | "Cancelled" | "Other";

export interface PNRRecord {
  id: string;
  number: string;
  maskedNumber: string;
  status: PNRStatus;
  chartStatus: string | null;
  lastUpdated: string;
  journey: Journey;
  passengers: Passenger[];
}
