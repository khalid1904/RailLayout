import { describe, it, expect } from "vitest";
import confirmed from "./fixtures/pnr-confirmed.json";
import waitlisted from "./fixtures/pnr-waitlisted.json";
import differentTrain from "./fixtures/pnr-different-train.json";
import { mapRailRadarPNR, parsePassengerStatus } from "@/lib/pnr/railradar/mapper";

describe("RailRadar mapper", () => {
  it("maps confirmed passengers with berth", () => {
    const result = mapRailRadarPNR("1234567890", confirmed);
    expect(result.journey.trainNumber).toBe("12637");
    expect(result.journey.trainName).toBe("PANDIAN EXPRESS");
    expect(result.passengers).toHaveLength(2);
    expect(result.passengers[0].coach).toBe("B2");
    expect(result.passengers[0].berthNumber).toBe(21);
    expect(result.passengers[0].berthType).toBe("Lower");
    expect(result.passengers[0].isAssigned).toBe(true);
  });

  it("maps waitlisted passenger without berth", () => {
    const result = mapRailRadarPNR("2345678901", waitlisted);
    expect(result.passengers[0].isAssigned).toBe(false);
    expect(result.passengers[0].coach).toBeNull();
    expect(result.chartStatus).toBe("Chart not prepared");
  });

  it("parses berth from status string", () => {
    const parsed = parsePassengerStatus("CNF B2 21 LB");
    expect(parsed.coach).toBe("B2");
    expect(parsed.berthNumber).toBe(21);
    expect(parsed.berthType).toBe("Lower");
  });

  it("parses RailRadar nested details format", () => {
    const parsed = parsePassengerStatus("CNF , B5 - 22 [LB]");
    expect(parsed.coach).toBe("B5");
    expect(parsed.berthNumber).toBe(22);
    expect(parsed.berthType).toBe("Lower");
  });

  it("maps nested RailRadar PNR response", async () => {
    const nested = await import("./fixtures/pnr-nested-railradar.json");
    const result = mapRailRadarPNR("5827194603", nested.default);
    expect(result.journey.trainNumber).toBe("12987");
    expect(result.journey.travelClass).toBe("3A");
    expect(result.passengers[0].coach).toBe("B5");
    expect(result.passengers[0].berthNumber).toBe(22);
    expect(result.passengers[1].coach).toBe("B5");
    expect(result.passengers[1].berthNumber).toBe(31);
    expect(result.chartStatus).toBe("Chart Prepared");
  });

  it("maps IRCTC-style PassengerStatus with berth fields", async () => {
    const { normalizeRawPNRData } = await import(
      "@/lib/pnr/railradar/normalize-raw"
    );
    const irctc = await import("./fixtures/pnr-irctc-confirmed.json");
    const normalized = normalizeRawPNRData(irctc.default);
    const result = mapRailRadarPNR("6515483791", normalized);
    expect(result.passengers[0].coach).toBe("B2");
    expect(result.passengers[0].berthNumber).toBe(21);
    expect(result.passengers[0].berthType).toBe("Lower");
    expect(result.passengers[0].isAssigned).toBe(true);
  });

  it("maps IRCTC waitlisted without berth when chart not prepared", async () => {
    const { normalizeRawPNRData } = await import(
      "@/lib/pnr/railradar/normalize-raw"
    );
    const irctc = await import("./fixtures/pnr-irctc-waitlisted.json");
    const normalized = normalizeRawPNRData(irctc.default);
    const result = mapRailRadarPNR("6515483790", normalized);
    expect(result.passengers[0].isAssigned).toBe(false);
    expect(result.passengers[0].currentStatus).toContain("RLWL");
  });

  it("maps live RailRadar format with coachId and charting", async () => {
    const { normalizeRawPNRData } = await import(
      "@/lib/pnr/railradar/normalize-raw"
    );
    const live = await import("./fixtures/pnr-railradar-live-format.json");
    const normalized = normalizeRawPNRData(live.default);
    const result = mapRailRadarPNR("4823455664", normalized);
    expect(result.journey.trainNumber).toBe("12637");
    expect(result.journey.travelClass).toBe("SL");
    expect(result.chartStatus).toBe("Chart Prepared");
    expect(result.passengers[0].coach).toBe("B2");
    expect(result.passengers[0].berthNumber).toBe(21);
    expect(result.passengers[0].berthType).toBe("Lower");
    expect(result.passengers[0].isAssigned).toBe(true);
    expect(result.passengers[1].berthNumber).toBe(22);
  });

  it("handles multiple passengers across coaches", () => {
    const multi = {
      ...confirmed,
      passengers: [
        ...confirmed.passengers,
        {
          number: 3,
          name: "ARUN P",
          bookingStatus: "CNF",
          currentStatus: "CNF B3 15 UB",
        },
      ],
    };
    const result = mapRailRadarPNR("1234567890", multi);
    const coaches = new Set(result.passengers.map((p) => p.coach));
    expect(coaches.size).toBe(2);
  });
});

describe("Journey merge", () => {
  it("detects same train and date", async () => {
    const { mergePNRs } = await import("@/lib/trip/journey-merge");
    const a = mapRailRadarPNR("1234567890", confirmed);
    const b = mapRailRadarPNR("2345678901", {
      ...waitlisted,
      trainNumber: "12637",
      journeyDate: "2026-08-27",
    });
    const result = mergePNRs([a, b]);
    expect(result.compatible).toBe(true);
  });

  it("detects different train", async () => {
    const { mergePNRs } = await import("@/lib/trip/journey-merge");
    const a = mapRailRadarPNR("1234567890", confirmed);
    const b = mapRailRadarPNR("3456789012", differentTrain);
    const result = mergePNRs([a, b]);
    expect(result.compatible).toBe(false);
    expect(result.conflicts).toHaveLength(1);
  });
});
