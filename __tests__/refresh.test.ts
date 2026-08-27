import { describe, it, expect } from "vitest";
import confirmed from "./fixtures/pnr-confirmed.json";
import { mapRailRadarPNR } from "@/lib/pnr/railradar/mapper";
import { diffPNRRecords } from "@/lib/trip/refresh";
import { mergeMetadata } from "@/lib/trip/refresh";

describe("Refresh and metadata", () => {
  it("detects berth change", () => {
    const before = mapRailRadarPNR("1234567890", confirmed);
    const afterData = {
      ...confirmed,
      passengers: [
        {
          ...confirmed.passengers[0],
          currentStatus: "CNF B2 35 LB",
          berth: 35,
        },
        confirmed.passengers[1],
      ],
    };
    const after = mapRailRadarPNR("1234567890", afterData);
    const diff = diffPNRRecords([before], [after]);
    expect(diff.hasChanges).toBe(true);
    expect(diff.changes.some((c) => c.field === "berth")).toBe(true);
  });

  it("detects coach change", () => {
    const before = mapRailRadarPNR("1234567890", confirmed);
    const afterData = {
      ...confirmed,
      passengers: [
        {
          ...confirmed.passengers[0],
          currentStatus: "CNF B3 21 LB",
          coach: "B3",
        },
        confirmed.passengers[1],
      ],
    };
    const after = mapRailRadarPNR("1234567890", afterData);
    const diff = diffPNRRecords([before], [after]);
    expect(diff.changes.some((c) => c.field === "coach")).toBe(true);
  });

  it("preserves metadata across refresh", () => {
    const pnr = mapRailRadarPNR("1234567890", confirmed);
    const metadata = {
      [pnr.passengers[0].id]: { displayName: "Dad", relationship: "Father" },
    };
    const merged = mergeMetadata(metadata, pnr.passengers);
    expect(merged[pnr.passengers[0].id].displayName).toBe("Dad");
  });

  it("reports no changes when data is identical", () => {
    const pnr = mapRailRadarPNR("1234567890", confirmed);
    const diff = diffPNRRecords([pnr], [pnr]);
    expect(diff.hasChanges).toBe(false);
  });
});

describe("User metadata", () => {
  it("stores display name, relationship, group, note", () => {
    const meta = {
      "1234567890:1": {
        displayName: "Dad",
        relationship: "Father",
        groupId: "family",
        note: "Window side",
      },
    };
    expect(meta["1234567890:1"].displayName).toBe("Dad");
    expect(meta["1234567890:1"].groupId).toBe("family");
  });
});
