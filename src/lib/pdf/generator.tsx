import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Trip, ExportPreferences, PassengerGroup } from "@/types/trip";
import type { Passenger } from "@/types/passenger";
import type { BerthSlot, LayoutDefinition } from "@/types/coach";
import {
  countCoaches,
  formatJourneyDate,
} from "@/lib/trip/journey-merge";
import {
  formatBerthTypeShort,
  getMainRowSize,
  groupPassengersByCoach,
  groupBerthsByBay,
  groupMainRows,
  isSleeperStyleLayout,
  resolveLayoutForPassengers,
  splitBaySlots,
} from "@/lib/coach/layout-engine";
import {
  getGroupColorMap,
  resolveOccupantColor,
  UNGROUPED_COLOR,
  type BerthGroupColor,
} from "@/lib/coach/group-colors";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#134e4a",
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 3,
    color: "#44403c",
  },
  meta: {
    fontSize: 10,
    color: "#78716c",
    marginBottom: 10,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#134e4a",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 8,
    color: "#57534e",
  },
  bayFrame: {
    border: "1 solid #e7e5e4",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#fafaf9",
  },
  bayLabel: {
    fontSize: 7,
    color: "#a8a29e",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  bayRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginBottom: 6,
  },
  mainRow: {
    flexDirection: "row",
    flexGrow: 1,
    gap: 4,
  },
  aisle: {
    width: 10,
    marginHorizontal: 6,
    backgroundColor: "#e7e5e4",
    borderRadius: 4,
  },
  sideCol: {
    width: 72,
  },
  berthCell: {
    flexGrow: 1,
    flexBasis: 0,
    border: "1 solid #d6d3d1",
    borderRadius: 4,
    padding: 5,
    minHeight: 42,
  },
  berthCellSide: {
    width: 72,
    border: "1 solid #d6d3d1",
    borderRadius: 4,
    padding: 5,
    minHeight: 42,
  },
  berthEmpty: {
    backgroundColor: "#f5f5f4",
    borderStyle: "dashed",
  },
  berthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  berthNumber: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#1c1917",
  },
  berthType: {
    fontSize: 6,
    color: "#78716c",
    textTransform: "uppercase",
  },
  berthName: {
    fontSize: 8,
    marginTop: 3,
    color: "#292524",
  },
  seatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  seatCell: {
    width: "11%",
    border: "1 solid #d6d3d1",
    borderRadius: 4,
    padding: 4,
    minHeight: 40,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #d6d3d1",
    paddingBottom: 4,
    marginBottom: 4,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottom: "0.5 solid #f5f5f4",
  },
  colBerth: { width: "12%" },
  colName: { width: "28%" },
  colGroup: { width: "20%" },
  colPnr: { width: "20%" },
  colRel: { width: "20%" },
});

function BerthPdfCell({
  slot,
  occupant,
  colorMap,
  side,
}: {
  slot: BerthSlot;
  occupant?: Passenger;
  colorMap: Map<string, BerthGroupColor>;
  side?: boolean;
}) {
  const empty = !occupant;
  const color = occupant
    ? resolveOccupantColor(occupant.groupId, colorMap)
    : null;

  return (
    <View
      style={[
        side ? styles.berthCellSide : styles.berthCell,
        empty
          ? styles.berthEmpty
          : {
              backgroundColor: color?.fill ?? UNGROUPED_COLOR.fill,
              borderColor: color?.border ?? UNGROUPED_COLOR.border,
            },
      ]}
    >
      <View style={styles.berthHeader}>
        <Text style={styles.berthNumber}>{slot.number}</Text>
        <Text style={styles.berthType}>
          {formatBerthTypeShort(slot.type)}
        </Text>
      </View>
      <Text style={styles.berthName}>
        {occupant
          ? occupant.displayName || occupant.originalName
          : "Available"}
      </Text>
    </View>
  );
}

function SleeperBayPdf({
  slots,
  occupantMap,
  colorMap,
  rowSize,
  bayIndex,
}: {
  slots: BerthSlot[];
  occupantMap: Map<number, Passenger>;
  colorMap: Map<string, BerthGroupColor>;
  rowSize: number;
  bayIndex: number;
}) {
  const { main, side } = splitBaySlots(slots);
  const rows = groupMainRows(main, rowSize);

  return (
    <View style={styles.bayFrame} wrap={false}>
      <Text style={styles.bayLabel}>Bay {bayIndex + 1}</Text>
      {rows.map((row, rowIndex) => (
        <View key={`${bayIndex}-${rowIndex}`} style={styles.bayRow}>
          <View style={styles.mainRow}>
            {row.map((slot) => (
              <BerthPdfCell
                key={slot.number}
                slot={slot}
                occupant={occupantMap.get(slot.number)}
                colorMap={colorMap}
              />
            ))}
          </View>
          <View style={styles.aisle} />
          <View style={styles.sideCol}>
            {side[rowIndex] ? (
              <BerthPdfCell
                slot={side[rowIndex]}
                occupant={occupantMap.get(side[rowIndex].number)}
                colorMap={colorMap}
                side
              />
            ) : (
              <View style={{ minHeight: 42 }} />
            )}
          </View>
        </View>
      ))}
      {side.length > rows.length && (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 4 }}>
          {side.slice(rows.length).map((slot) => (
            <BerthPdfCell
              key={slot.number}
              slot={slot}
              occupant={occupantMap.get(slot.number)}
              colorMap={colorMap}
              side
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SittingCoachPdf({
  layout,
  occupantMap,
  colorMap,
}: {
  layout: LayoutDefinition;
  occupantMap: Map<number, Passenger>;
  colorMap: Map<string, BerthGroupColor>;
}) {
  return (
    <View style={styles.seatGrid}>
      {layout.berthSlots.map((slot) => {
        const occupant = occupantMap.get(slot.number);
        const empty = !occupant;
        const color = occupant
          ? resolveOccupantColor(occupant.groupId, colorMap)
          : null;
        return (
          <View
            key={slot.number}
            style={[
              styles.seatCell,
              empty
                ? styles.berthEmpty
                : {
                    backgroundColor: color?.fill ?? UNGROUPED_COLOR.fill,
                    borderColor: color?.border ?? UNGROUPED_COLOR.border,
                  },
            ]}
          >
            <Text style={styles.berthNumber}>{slot.number}</Text>
            <Text style={styles.berthName}>
              {occupant
                ? occupant.displayName || occupant.originalName
                : "Available"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function GroupLegend({
  groups,
  colorMap,
  showUngrouped,
}: {
  groups: PassengerGroup[];
  colorMap: Map<string, BerthGroupColor>;
  showUngrouped: boolean;
}) {
  if (groups.length === 0 && !showUngrouped) return null;
  return (
    <View style={styles.legendRow}>
      {groups.map((g) => {
        const color = colorMap.get(g.id) ?? UNGROUPED_COLOR;
        return (
          <View key={g.id} style={styles.legendItem}>
            <View
              style={[styles.legendSwatch, { backgroundColor: color.swatch }]}
            />
            <Text style={styles.legendLabel}>{g.name}</Text>
          </View>
        );
      })}
      {showUngrouped && (
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendSwatch,
              { backgroundColor: UNGROUPED_COLOR.swatch },
            ]}
          />
          <Text style={styles.legendLabel}>Ungrouped</Text>
        </View>
      )}
    </View>
  );
}

function TripPdfDocument({
  trip,
  passengers,
  prefs,
}: {
  trip: Trip;
  passengers: Passenger[];
  prefs: ExportPreferences;
}) {
  const layout = resolveLayoutForPassengers(
    trip.journey.travelClass,
    passengers
  );
  const coachGroups = groupPassengersByCoach(passengers);
  const coaches = Array.from(coachGroups.entries())
    .filter(([code]) => code !== "UNASSIGNED")
    .sort(([a], [b]) => a.localeCompare(b));

  const colorMap = getGroupColorMap(trip.groups);
  const sleeperStyle = isSleeperStyleLayout(layout.classCode);
  const rowSize = getMainRowSize(layout.classCode);
  const bays = groupBerthsByBay(layout);

  const groupName = (groupId?: string) =>
    trip.groups.find((g) => g.id === groupId)?.name ?? "";

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.title}>{trip.name || "TRAVEL GROUP"}</Text>
        <Text style={styles.subtitle}>
          {trip.journey.trainName || "Train Journey"}
        </Text>
        <Text style={styles.subtitle}>Train {trip.journey.trainNumber}</Text>
        <Text style={styles.subtitle}>
          {trip.journey.boardingStation.name} →{" "}
          {trip.journey.destinationStation.name}
        </Text>
        <Text style={styles.meta}>
          {formatJourneyDate(trip.journey.journeyDate)}
        </Text>
        <Text style={styles.meta}>
          {trip.pnrs.length} PNRs · {passengers.length} passengers ·{" "}
          {countCoaches(passengers)} coaches
        </Text>
      </Page>

      {prefs.includeCoachDiagrams &&
        coaches.map(([coachCode, coachPassengers]) => {
          const occupantMap = new Map<number, Passenger>();
          for (const p of coachPassengers) {
            if (p.berthNumber) occupantMap.set(p.berthNumber, p);
          }
          const showUngrouped = coachPassengers.some(
            (p) => p.isAssigned && !p.groupId
          );

          return (
            <Page
              key={coachCode}
              size="A4"
              orientation="landscape"
              style={styles.page}
            >
              <Text style={styles.coachTitle}>COACH {coachCode}</Text>
              <Text style={styles.meta}>
                {coachPassengers.length} passengers · {layout.label}
              </Text>
              <GroupLegend
                groups={trip.groups}
                colorMap={colorMap}
                showUngrouped={showUngrouped}
              />

              {sleeperStyle ? (
                Array.from(bays.entries()).map(([bayIndex, slots]) => (
                  <SleeperBayPdf
                    key={bayIndex}
                    bayIndex={bayIndex}
                    slots={slots}
                    occupantMap={occupantMap}
                    colorMap={colorMap}
                    rowSize={rowSize}
                  />
                ))
              ) : (
                <SittingCoachPdf
                  layout={layout}
                  occupantMap={occupantMap}
                  colorMap={colorMap}
                />
              )}

              {prefs.includePassengerList && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.coachTitle}>PASSENGER LIST</Text>
                  <View style={styles.tableHeader}>
                    <Text style={styles.colBerth}>Berth</Text>
                    <Text style={styles.colName}>Name</Text>
                    {prefs.includeGroups && (
                      <Text style={styles.colGroup}>Group</Text>
                    )}
                    {prefs.includeRelationships && (
                      <Text style={styles.colRel}>Relationship</Text>
                    )}
                    <Text style={styles.colPnr}>PNR</Text>
                  </View>
                  {coachPassengers.map((p) => (
                    <View key={p.id} style={styles.tableRow}>
                      <Text style={styles.colBerth}>
                        {p.berthNumber ?? "—"}
                      </Text>
                      <Text style={styles.colName}>
                        {p.displayName || p.originalName}
                      </Text>
                      {prefs.includeGroups && (
                        <Text style={styles.colGroup}>
                          {groupName(p.groupId)}
                        </Text>
                      )}
                      {prefs.includeRelationships && (
                        <Text style={styles.colRel}>
                          {String(p.relationship ?? "")}
                        </Text>
                      )}
                      <Text style={styles.colPnr}>
                        {prefs.includeFullPnr ? p.pnrNumber : p.maskedPnr}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Page>
          );
        })}
    </Document>
  );
}

export async function generateTripPdf(
  trip: Trip,
  passengers: Passenger[],
  prefs: ExportPreferences
): Promise<Blob> {
  const doc = (
    <TripPdfDocument trip={trip} passengers={passengers} prefs={prefs} />
  );
  return pdf(doc).toBlob();
}
