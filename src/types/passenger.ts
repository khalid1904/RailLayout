export type BerthType =
  | "Lower"
  | "Middle"
  | "Upper"
  | "SideLower"
  | "SideUpper"
  | "Seat"
  | "Other";

export type Relationship =
  | "Self"
  | "Father"
  | "Mother"
  | "Spouse"
  | "Son"
  | "Daughter"
  | "Brother"
  | "Sister"
  | "Grandfather"
  | "Grandmother"
  | "Uncle"
  | "Aunt"
  | "Relative"
  | "Friend"
  | "Colleague"
  | "Other";

export interface PassengerMetadata {
  displayName?: string;
  relationship?: Relationship | string;
  groupId?: string;
  note?: string;
}

export interface Passenger extends PassengerMetadata {
  id: string;
  pnrId: string;
  pnrNumber: string;
  maskedPnr: string;
  passengerNumber: number;
  originalName: string;
  bookingStatus: string;
  currentStatus: string;
  coach: string | null;
  berthNumber: number | null;
  berthType: BerthType | null;
  isAssigned: boolean;
}
