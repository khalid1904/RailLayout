export interface RailRadarMeta {
  traceId?: string;
  timestamp?: string;
  executionTime?: number;
  source?: string;
}

export interface RailRadarEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
  meta?: RailRadarMeta;
}

export interface RailRadarStation {
  code?: string;
  name?: string;
  stationCode?: string;
  stationName?: string;
}

export interface RailRadarPassengerStatusBlock {
  status?: string;
  coach?: string | null;
  coachId?: string | null;
  coachCode?: string | null;
  coachNumber?: string | null;
  berthNo?: number | string | null;
  berthNumber?: number | string | null;
  berthCode?: string | null;
  berthType?: string | null;
  details?: string;
  formatted?: string;
}

export interface RailRadarPassenger {
  number?: number;
  serialNumber?: string;
  name?: string;
  passengerName?: string;
  bookingStatus?: string;
  booking_status?: string;
  currentStatus?: string;
  current_status?: string;
  coach?: string;
  berth?: string | number;
  berthNumber?: string | number;
  berthNo?: string | number;
  berthType?: string;
  berthCode?: string;
  coachNumber?: string;
  isConfirmed?: boolean;
  isRAC?: boolean;
  isWaitlisted?: boolean;
  isCancelled?: boolean;
  booking?: RailRadarPassengerStatusBlock;
  current?: RailRadarPassengerStatusBlock;
}

export interface RailRadarTrainInfo {
  number?: string;
  name?: string;
  class?: string;
  travelClass?: string;
  journeyClass?: string;
  quota?: string;
  dateOfJourney?: string;
  doj?: string;
  source?: RailRadarStation;
  destination?: RailRadarStation;
  boardingPoint?: RailRadarStation;
  boardingStation?: RailRadarStation;
  reservationUpto?: RailRadarStation;
}

export interface RailRadarJourneyInfo {
  dateOfJourney?: string;
  doj?: string;
  class?: string;
  travelClass?: string;
  quota?: string;
  source?: RailRadarStation;
  destination?: RailRadarStation;
  boardingPoint?: RailRadarStation;
  boardingStation?: RailRadarStation;
  reservationUpto?: RailRadarStation;
}

export interface RailRadarChartInfo {
  status?: string;
  prepared?: boolean;
}

export interface RailRadarChartingInfo {
  status?: string;
  prepared?: boolean;
  isPrepared?: boolean;
}

export interface RailRadarPNRData {
  pnr?: string;
  pnrNumber?: string;
  train?: RailRadarTrainInfo;
  journey?: RailRadarJourneyInfo;
  chart?: RailRadarChartInfo;
  charting?: RailRadarChartingInfo;
  trainNumber?: string;
  trainNo?: string;
  trainName?: string;
  journeyDate?: string;
  dateOfJourney?: string;
  doj?: string;
  from?: RailRadarStation | string;
  to?: RailRadarStation | string;
  fromStation?: RailRadarStation | string;
  toStation?: RailRadarStation | string;
  boardingPoint?: RailRadarStation | string;
  boardingStation?: RailRadarStation | string;
  reservationUpto?: RailRadarStation | string;
  destination?: RailRadarStation | string;
  class?: string;
  travelClass?: string;
  quota?: string;
  chartStatus?: string;
  chartPrepared?: boolean | string;
  passengers?: RailRadarPassenger[];
  passengerList?: RailRadarPassenger[];
  passengerDetails?: RailRadarPassenger[];
  passengerStatus?: RailRadarPassenger[];
}

export interface RailRadarCoachBerth {
  number?: number;
  type?: string;
  berthType?: string;
}

export interface RailRadarCoachCabin {
  berths?: RailRadarCoachBerth[];
}

export interface RailRadarCoachData {
  trainNumber?: string;
  coaches?: Array<{
    code?: string;
    coachCode?: string;
    type?: string;
    class?: string;
    cabins?: RailRadarCoachCabin[];
    berths?: RailRadarCoachBerth[];
  }>;
  rake?: string[];
}
