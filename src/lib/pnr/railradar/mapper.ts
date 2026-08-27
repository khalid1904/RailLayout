import type { BerthType } from "@/types/passenger";
import type { Journey, StationInfo } from "@/types/journey";
import type { PNRRecord, PNRStatus } from "@/types/pnr";
import type { Passenger } from "@/types/passenger";
import { maskPnr } from "@/lib/privacy/mask-pnr";
import type {
  RailRadarPassenger,
  RailRadarPNRData,
  RailRadarStation,
} from "./types";

const BERTH_TYPE_MAP: Record<string, BerthType> = {
  LB: "Lower",
  LOWER: "Lower",
  L: "Lower",
  MB: "Middle",
  MIDDLE: "Middle",
  M: "Middle",
  UB: "Upper",
  UPPER: "Upper",
  U: "Upper",
  SL: "SideLower",
  "SIDE LOWER": "SideLower",
  SU: "SideUpper",
  "SIDE UPPER": "SideUpper",
  WS: "SideLower",
  SS: "SideUpper",
  SEAT: "Seat",
  S: "Seat",
  CB: "Lower",
  CP: "Upper",
};

function resolveStation(
  value: RailRadarStation | string | undefined,
  fallbackCode = "",
  fallbackName = ""
): StationInfo {
  if (!value) {
    return { code: fallbackCode, name: fallbackName || fallbackCode };
  }
  if (typeof value === "string") {
    const parts = value.split("-");
    if (parts.length >= 2) {
      return {
        name: parts[0].trim(),
        code: parts[parts.length - 1].trim(),
      };
    }
    return { code: value, name: value };
  }
  return {
    code: value.code ?? value.stationCode ?? fallbackCode,
    name: value.name ?? value.stationName ?? fallbackName ?? fallbackCode,
  };
}

export function normalizeBerthType(
  raw: string | undefined | null
): BerthType | null {
  if (!raw) return null;
  const key = raw.trim().toUpperCase();
  return BERTH_TYPE_MAP[key] ?? "Other";
}

export interface ParsedStatus {
  statusText: string;
  coach: string | null;
  berthNumber: number | null;
  berthType: BerthType | null;
  isAssigned: boolean;
}

function parseBerthNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = parseInt(value.trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parsePassengerStatus(status: string): ParsedStatus {
  const trimmed = status.trim();
  const upper = trimmed.toUpperCase();

  if (
    upper.includes("CAN") ||
    upper.includes("CANCEL") ||
    upper.includes("MOD")
  ) {
    return {
      statusText: trimmed,
      coach: null,
      berthNumber: null,
      berthType: null,
      isAssigned: false,
    };
  }

  const wlMatch = upper.match(/^(GNWL|RLWL|PQWL|TQWL|WL|REGRET)/);
  if (wlMatch && !upper.includes("CNF") && !/\b[A-Z]\d+/.test(upper)) {
    return {
      statusText: trimmed,
      coach: null,
      berthNumber: null,
      berthType: null,
      isAssigned: false,
    };
  }

  const patterns = [
    /(?:CNF|RAC|CONFIRMED)\/([A-Z]\d+[A-Z]?)\/(\d+)\/([A-Z]{1,2})/i,
    /(?:CNF|RAC|CONFIRMED)?\s*([A-Z]\d+[A-Z]?)\s*-\s*(\d+)\s*\[([A-Z]{1,2})\]/i,
    /(?:CNF|RAC|CONFIRMED)?\s*([A-Z]\d+[A-Z]?)\s+(\d+)\s*([A-Z]{1,2})?\b/i,
    /(?:CNF|RAC|CONFIRMED)?\s*([A-Z]\d+[A-Z]?)\s+(\d+)\b/i,
    /([A-Z]\d+[A-Z]?)\/(\d+)\/([A-Z]{1,2})/i,
    /([A-Z]\d+[A-Z]?)\s*[-/]\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      const coach = match[1]?.toUpperCase() ?? null;
      const berthNumber = match[2] ? parseInt(match[2], 10) : null;
      const berthType = normalizeBerthType(match[3]);
      return {
        statusText: trimmed,
        coach,
        berthNumber: Number.isFinite(berthNumber) ? berthNumber : null,
        berthType,
        isAssigned: Boolean(coach && berthNumber),
      };
    }
  }

  if (upper.startsWith("RAC") && !/\b[A-Z]\d+/.test(upper)) {
    return {
      statusText: trimmed,
      coach: null,
      berthNumber: null,
      berthType: null,
      isAssigned: false,
    };
  }

  return {
    statusText: trimmed,
    coach: null,
    berthNumber: null,
    berthType: null,
    isAssigned: false,
  };
}

function inferPnrStatus(passengers: Passenger[]): PNRStatus {
  const statuses = passengers.map((p) => p.currentStatus.toUpperCase());
  if (statuses.every((s) => s.includes("CAN") || s.includes("CANCEL"))) {
    return "Cancelled";
  }
  if (statuses.some((s) => s.includes("CNF") || s.includes("CONFIRM"))) {
    return "Confirmed";
  }
  if (statuses.some((s) => s.includes("RAC"))) {
    return "RAC";
  }
  if (statuses.some((s) => s.match(/WL|GNWL|RLWL|PQWL|TQWL/))) {
    return "Waitlisted";
  }
  return "Other";
}

function mapPassenger(
  raw: RailRadarPassenger,
  index: number,
  pnrNumber: string,
  pnrId: string
): Passenger {
  const currentBlock = raw.current;
  const bookingBlock = raw.booking;

  const currentStatus =
    raw.currentStatus ??
    raw.current_status ??
    currentBlock?.details ??
    currentBlock?.status ??
    "";

  const bookingStatus =
    raw.bookingStatus ??
    raw.booking_status ??
    bookingBlock?.details ??
    bookingBlock?.status ??
    "";

  const parsed = parsePassengerStatus(currentStatus);

  const coachRaw =
    raw.coach ??
    raw.coachNumber ??
    currentBlock?.coachId ??
    currentBlock?.coach ??
    currentBlock?.coachCode ??
    bookingBlock?.coachId ??
    bookingBlock?.coach ??
    bookingBlock?.coachCode ??
    parsed.coach;

  const coach =
    coachRaw && String(coachRaw).trim()
      ? String(coachRaw).trim().toUpperCase()
      : null;

  const berthNumber =
    parseBerthNumber(raw.berth) ??
    parseBerthNumber(raw.berthNumber) ??
    parseBerthNumber(raw.berthNo) ??
    parseBerthNumber(currentBlock?.berthNo) ??
    parseBerthNumber(currentBlock?.berthNumber) ??
    parsed.berthNumber;

  const berthType =
    normalizeBerthType(raw.berthType) ??
    normalizeBerthType(raw.berthCode) ??
    normalizeBerthType(currentBlock?.berthCode) ??
    normalizeBerthType(currentBlock?.berthType) ??
    parsed.berthType;

  const isAssigned = Boolean(coach && berthNumber);

  const name =
    raw.name ??
    raw.passengerName ??
    (raw.serialNumber && !/^passenger\s*\d+$/i.test(raw.serialNumber)
      ? raw.serialNumber
      : undefined) ??
    `Passenger ${index + 1}`;

  return {
    id: `${pnrNumber}:${index + 1}`,
    pnrId,
    pnrNumber,
    maskedPnr: maskPnr(pnrNumber),
    passengerNumber: raw.number ?? index + 1,
    originalName: name,
    bookingStatus,
    currentStatus: currentStatus || parsed.statusText,
    coach: isAssigned ? coach : null,
    berthNumber: isAssigned ? berthNumber : null,
    berthType: isAssigned ? berthType : null,
    isAssigned,
  };
}

function resolveChartStatus(data: RailRadarPNRData): string | null {
  if (data.charting?.status) return data.charting.status;
  if (data.charting?.prepared === true || data.charting?.isPrepared === true) {
    return "Chart prepared";
  }
  if (data.charting?.prepared === false || data.charting?.isPrepared === false) {
    return "Chart not prepared";
  }
  if (data.chart?.status) return data.chart.status;
  if (typeof data.chart?.prepared === "boolean") {
    return data.chart.prepared ? "Chart prepared" : "Chart not prepared";
  }
  if (typeof data.chartPrepared === "boolean") {
    return data.chartPrepared ? "Chart prepared" : "Chart not prepared";
  }
  if (data.chartStatus) return data.chartStatus;
  return null;
}

function resolveTravelClass(data: RailRadarPNRData): string {
  return (
    data.train?.class ??
    data.train?.travelClass ??
    data.train?.journeyClass ??
    data.journey?.class ??
    data.journey?.travelClass ??
    data.travelClass ??
    data.class ??
    ""
  );
}

function resolveJourneyDate(data: RailRadarPNRData): string {
  return (
    data.train?.dateOfJourney ??
    data.journey?.dateOfJourney ??
    data.journey?.doj ??
    data.journeyDate ??
    data.dateOfJourney ??
    data.doj ??
    ""
  );
}

export function mapRailRadarPNR(
  pnrNumber: string,
  data: RailRadarPNRData
): PNRRecord {
  const pnrId = `pnr-${pnrNumber}`;
  const passengersRaw = data.passengers ?? [];

  const passengers = passengersRaw.map((p, i) =>
    mapPassenger(p, i, pnrNumber, pnrId)
  );

  const journey: Journey = {
    trainNumber: String(
      data.train?.number ?? data.trainNumber ?? data.trainNo ?? ""
    ),
    trainName: data.train?.name ?? data.trainName ?? "",
    journeyDate: resolveJourneyDate(data),
    boardingStation: resolveStation(
      data.journey?.boardingPoint ??
        data.journey?.boardingStation ??
        data.train?.boardingPoint ??
        data.train?.boardingStation ??
        data.train?.source ??
        data.journey?.source ??
        data.boardingStation ??
        data.boardingPoint ??
        data.from ??
        data.fromStation
    ),
    destinationStation: resolveStation(
      data.journey?.destination ??
        data.train?.destination ??
        data.train?.reservationUpto ??
        data.destination ??
        data.reservationUpto ??
        data.to ??
        data.toStation
    ),
    travelClass: resolveTravelClass(data),
    quota: data.journey?.quota ?? data.train?.quota ?? data.quota,
  };

  return {
    id: pnrId,
    number: pnrNumber,
    maskedNumber: maskPnr(pnrNumber),
    status: inferPnrStatus(passengers),
    chartStatus: resolveChartStatus(data),
    lastUpdated: new Date().toISOString(),
    journey,
    passengers,
  };
}
