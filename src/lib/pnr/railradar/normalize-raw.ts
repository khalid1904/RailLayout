import type {
  RailRadarJourneyInfo,
  RailRadarPNRData,
  RailRadarPassenger,
} from "./types";

export interface BerthDiagnostics {
  passengerCount: number;
  assignedCount: number;
  chartStatus: string | null;
  travelClass: string | null;
  topLevelKeys: string[];
  passengerKeys: string[];
  currentBlockKeys: string[];
  sampleStatuses: string[];
  berthFieldsPresent: string[];
}

const BERTH_FIELD_NAMES = [
  "coach",
  "coachCode",
  "Coach",
  "coachNumber",
  "berthCode",
  "berthNo",
  "current",
  "booking",
];

function collectBlockFields(
  block: Record<string, unknown> | undefined,
  prefix: string,
  fields: string[]
) {
  if (!block) return;
  for (const [key, value] of Object.entries(block)) {
    if (value != null && value !== "") {
      fields.push(`${prefix}.${key}`);
    }
  }
}

export function inspectRawPNRData(
  data: RailRadarPNRData,
  passengers: { isAssigned: boolean; currentStatus: string }[]
): BerthDiagnostics {
  const rawList = extractRawPassengerList(data);
  const first = (rawList[0] ?? {}) as Record<string, unknown>;
  const current = first.current as Record<string, unknown> | undefined;

  const berthFieldsPresent: string[] = [];
  for (const field of BERTH_FIELD_NAMES) {
    if (field in first && first[field] != null && first[field] !== "") {
      berthFieldsPresent.push(field);
    }
  }
  collectBlockFields(current, "current", berthFieldsPresent);
  collectBlockFields(
    first.booking as Record<string, unknown> | undefined,
    "booking",
    berthFieldsPresent
  );

  const { chartStatus, travelClass } = extractChartAndClass(data);

  return {
    passengerCount: passengers.length,
    assignedCount: passengers.filter((p) => p.isAssigned).length,
    chartStatus,
    travelClass,
    topLevelKeys: Object.keys(data),
    passengerKeys: Object.keys(first),
    currentBlockKeys: current ? Object.keys(current) : [],
    sampleStatuses: passengers.slice(0, 3).map((p) => p.currentStatus),
    berthFieldsPresent: [...new Set(berthFieldsPresent)],
  };
}

export function extractRawPassengerList(data: RailRadarPNRData): unknown[] {
  const record = data as Record<string, unknown>;
  const candidates = [
    data.passengers,
    data.passengerList,
    data.passengerDetails,
    data.passengerStatus,
    record.PassengerStatus,
    record.passenger,
  ];

  for (const list of candidates) {
    if (Array.isArray(list) && list.length > 0) {
      return list;
    }
  }
  return [];
}

function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickBlock(
  raw: Record<string, unknown>,
  key: string
): Record<string, unknown> | undefined {
  const block = raw[key];
  if (block && typeof block === "object" && !Array.isArray(block)) {
    return block as Record<string, unknown>;
  }
  return undefined;
}

function pickBerthNumber(...values: unknown[]): string | number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function buildStatusLabel(
  status: string | undefined,
  coach: string | undefined,
  berthNo: string | number | undefined,
  berthCode: string | undefined
): string | undefined {
  if (status && coach && berthNo) {
    return `${status} ${coach} ${berthNo}${berthCode ? ` ${berthCode}` : ""}`;
  }
  return pickString(status);
}

function extractCoach(
  r: Record<string, unknown>,
  current?: Record<string, unknown>,
  booking?: Record<string, unknown>
): string | undefined {
  return pickString(
    r.coach,
    r.coachId,
    r.coachCode,
    r.Coach,
    r.coachNumber,
    current?.coachId,
    current?.coach,
    current?.coachCode,
    current?.coachNumber,
    current?.Coach,
    current?.CoachCode,
    current?.CoachId,
    booking?.coachId,
    booking?.coach,
    booking?.coachCode,
    booking?.coachNumber
  );
}

/** Flatten RailRadar live / IRCTC / legacy shapes into one passenger object. */
export function normalizeRawPassenger(
  raw: unknown,
  index: number
): RailRadarPassenger {
  if (!raw || typeof raw !== "object") {
    return { number: index + 1, name: `Passenger ${index + 1}` };
  }

  const r = raw as Record<string, unknown>;
  const current = pickBlock(r, "current") ?? pickBlock(r, "Current");
  const booking = pickBlock(r, "booking") ?? pickBlock(r, "Booking");

  const coach =
    extractCoach(r, current, booking) ??
    pickString(r.CurrentCoachId, r.currentCoachId, r.BookingCoachId);

  const berthNo = pickBerthNumber(
    current?.berthNo,
    current?.berthNumber,
    current?.BerthNo,
    r.CurrentBerthNo,
    r.currentBerthNo,
    booking?.berthNo,
    booking?.berthNumber,
    r.berth,
    r.berthNo,
    r.berthNumber
  );

  const berthCode = pickString(
    r.berthCode,
    r.BerthCode,
    r.CurrentBerthCode,
    current?.berthCode,
    current?.berthType,
    booking?.berthCode,
    booking?.berthType
  );

  const currentStatus =
    pickString(
      r.currentStatus,
      r.current_status,
      r.CurrentStatus,
      current?.formatted,
      current?.details,
      current?.Details
    ) ??
    buildStatusLabel(
      pickString(current?.status, current?.Status),
      coach,
      berthNo,
      berthCode
    );

  const bookingStatus =
    pickString(
      r.bookingStatus,
      r.booking_status,
      r.BookingStatus,
      booking?.formatted,
      booking?.details,
      booking?.Details
    ) ??
    buildStatusLabel(
      pickString(booking?.status, booking?.Status),
      pickString(booking?.coachId, booking?.coach, booking?.coachCode),
      pickBerthNumber(booking?.berthNo, booking?.berthNumber),
      pickString(booking?.berthCode)
    );

  const name = pickString(
    r.name,
    r.Name,
    r.passengerName,
    r.passenger_name,
    r.serialNumber,
    r.SerialNumber
  );

  return {
    number:
      typeof r.number === "number"
        ? r.number
        : typeof r.Number === "number"
          ? r.Number
          : index + 1,
    name:
      name && !/^passenger\s*\d+$/i.test(name)
        ? name
        : `Passenger ${index + 1}`,
    bookingStatus,
    currentStatus,
    coach,
    berth: berthNo,
    berthNumber: berthNo,
    berthNo,
    berthType: berthCode,
    berthCode,
    booking: booking as RailRadarPassenger["booking"],
    current: current
      ? {
          status: pickString(current.status, current.Status),
          coach,
          coachId: coach,
          coachCode: coach,
          berthNo,
          berthNumber: berthNo,
          berthCode,
          details: pickString(current.formatted, current.details, current.Details),
          formatted: pickString(current.formatted, current.details),
        }
      : undefined,
  };
}

function extractChartAndClass(data: RailRadarPNRData): {
  chartStatus: string | null;
  travelClass: string | null;
} {
  const record = data as Record<string, unknown>;
  const charting = (data.charting ?? record.charting) as
    | Record<string, unknown>
    | undefined;
  const train = data.train as Record<string, unknown> | undefined;

  const chartStatus =
    pickString(charting?.status, data.chart?.status, data.chartStatus) ??
    (charting?.prepared === true || charting?.isPrepared === true
      ? "Chart prepared"
      : charting?.prepared === false || charting?.isPrepared === false
        ? "Chart not prepared"
        : typeof data.chartPrepared === "boolean"
          ? data.chartPrepared
            ? "Chart prepared"
            : "Chart not prepared"
          : null);

  const travelClass =
    pickString(
      train?.class,
      train?.travelClass,
      train?.journeyClass,
      data.journey?.class,
      data.journey?.travelClass,
      data.travelClass,
      data.class
    ) ?? null;

  return { chartStatus, travelClass };
}

function journeyFromTrain(
  train: Record<string, unknown> | undefined,
  existing?: RailRadarJourneyInfo
): RailRadarJourneyInfo | undefined {
  if (!train) return existing;

  return {
    ...(existing ?? {}),
    dateOfJourney:
      pickString(train.dateOfJourney, train.doj, train.date_of_journey) ??
      existing?.dateOfJourney,
    class:
      pickString(train.class, train.travelClass, train.journeyClass) ??
      existing?.class,
    quota: pickString(train.quota, train.Quota) ?? existing?.quota,
    source: (train.source ?? train.from ?? existing?.source) as
      | RailRadarJourneyInfo["source"]
      | undefined,
    destination: (train.destination ??
      train.to ??
      train.reservationUpto ??
      existing?.destination) as RailRadarJourneyInfo["destination"] | undefined,
    boardingPoint: (train.boardingPoint ??
      train.boardingStation ??
      train.source ??
      existing?.boardingPoint) as
      | RailRadarJourneyInfo["boardingPoint"]
      | undefined,
  };
}

export function normalizeRawPNRData(data: RailRadarPNRData): RailRadarPNRData {
  const record = data as Record<string, unknown>;
  const train = (data.train ?? record.Train) as Record<string, unknown> | undefined;
  const charting = (data.charting ?? record.charting) as
    | Record<string, unknown>
    | undefined;
  const journey = (data.journey ?? record.Journey) as
    | Record<string, unknown>
    | undefined;

  const mergedJourney = journeyFromTrain(
    train,
    journey
      ? {
          ...(data.journey ?? {}),
          dateOfJourney: pickString(
            journey.dateOfJourney,
            journey.doj,
            journey.date_of_journey
          ),
          class: pickString(journey.class, journey.travelClass),
          quota: pickString(journey.quota, journey.Quota),
          source: journey.source as RailRadarJourneyInfo["source"],
          destination: journey.destination as RailRadarJourneyInfo["destination"],
          boardingPoint: (journey.boardingPoint ??
            journey.boardingStation) as RailRadarJourneyInfo["boardingPoint"],
        }
      : data.journey
  );

  const rawPassengers = extractRawPassengerList(data);

  return {
    ...data,
    pnr: data.pnr ?? data.pnrNumber,
    train: train
      ? {
          number: pickString(train.number, train.Number, train.trainNumber),
          name: pickString(train.name, train.Name, train.trainName),
          class: pickString(train.class, train.travelClass, train.journeyClass),
          quota: pickString(train.quota, train.Quota),
          dateOfJourney: pickString(train.dateOfJourney, train.doj),
          source: train.source as RailRadarPNRData["train"],
          destination: train.destination as RailRadarPNRData["train"],
          boardingPoint: train.boardingPoint as RailRadarPNRData["train"],
        }
      : data.train,
    journey: mergedJourney,
    chart: charting
      ? {
          status: pickString(charting.status, charting.Status),
          prepared:
            (charting.prepared as boolean | undefined) ??
            (charting.isPrepared as boolean | undefined),
        }
      : data.chart,
    passengers: rawPassengers.map((p, i) => normalizeRawPassenger(p, i)),
  };
}
