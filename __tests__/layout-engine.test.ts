import { describe, it, expect } from "vitest";
import {
  resolveLayout,
  findBerthSlot,
  getNearbyPassengers,
  groupBerthsByBay,
  splitBaySlots,
  groupMainRows,
  formatBerthTypeShort,
  getMainRowSize,
} from "@/lib/coach/layout-engine";
import type { Passenger } from "@/types/passenger";

function makePassenger(
  id: string,
  coach: string,
  berth: number,
  type: Passenger["berthType"] = "Lower"
): Passenger {
  return {
    id,
    pnrId: "pnr-1",
    pnrNumber: "1234567890",
    maskedPnr: "••••7890",
    passengerNumber: 1,
    originalName: id,
    bookingStatus: "CNF",
    currentStatus: `CNF ${coach} ${berth}`,
    coach,
    berthNumber: berth,
    berthType: type,
    isAssigned: true,
  };
}

describe("Coach layout engine", () => {
  const layout = resolveLayout("SL");

  it("resolves lower, middle, upper berths", () => {
    expect(findBerthSlot(layout, 1)?.type).toBe("Lower");
    expect(findBerthSlot(layout, 2)?.type).toBe("Middle");
    expect(findBerthSlot(layout, 3)?.type).toBe("Upper");
  });

  it("resolves side berths", () => {
    expect(findBerthSlot(layout, 7)?.type).toBe("SideLower");
    expect(findBerthSlot(layout, 8)?.type).toBe("SideUpper");
  });

  it("groups berths into bays", () => {
    const bays = groupBerthsByBay(layout);
    expect(bays.size).toBe(9);
    expect(bays.get(0)?.length).toBe(8);
  });

  it("finds same bay passengers", () => {
    const passengers = [
      makePassenger("p1", "B2", 21, "Lower"),
      makePassenger("p2", "B2", 22, "Middle"),
      makePassenger("p3", "B2", 23, "Upper"),
      makePassenger("p4", "B2", 29, "Lower"),
    ];
    const nearby = getNearbyPassengers(passengers[0], passengers, layout);
    expect(nearby.sameBay).toContain("p2");
    expect(nearby.sameBay).toContain("p3");
    expect(nearby.nearby).toContain("p4");
  });

  it("shows empty berths in layout", () => {
    expect(layout.berthSlots.some((s) => s.number === 27)).toBe(true);
  });

  it("expands sleeper layout for berth 80", async () => {
    const { resolveLayoutForPassengers, findBerthSlot } = await import(
      "@/lib/coach/layout-engine"
    );
    const passengers = [makePassenger("p80", "S5", 80, "SideUpper")];
    const expanded = resolveLayoutForPassengers("SL", passengers);
    expect(findBerthSlot(expanded, 80)).toBeTruthy();
    expect(expanded.totalBerths).toBeGreaterThanOrEqual(80);
    expect(findBerthSlot(expanded, 80)?.type).toBe("SideUpper");
  });

  it("splits bay into main and side for IRCTC geometry", () => {
    const bay = groupBerthsByBay(layout).get(0)!;
    const { main, side } = splitBaySlots(bay);
    expect(main.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(side.map((s) => s.number)).toEqual([7, 8]);
    const rows = groupMainRows(main, getMainRowSize("SL"));
    expect(rows).toHaveLength(2);
    expect(rows[0].map((s) => s.number)).toEqual([1, 2, 3]);
    expect(rows[1].map((s) => s.number)).toEqual([4, 5, 6]);
  });

  it("formats short berth labels", () => {
    expect(formatBerthTypeShort("SideLower")).toBe("S.LOWER");
    expect(formatBerthTypeShort("Middle")).toBe("MIDDLE");
  });
});
