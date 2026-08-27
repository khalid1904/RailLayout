export interface StationInfo {
  code: string;
  name: string;
}

export interface Journey {
  trainNumber: string;
  trainName: string;
  journeyDate: string;
  boardingStation: StationInfo;
  destinationStation: StationInfo;
  travelClass: string;
  quota?: string;
}

export function journeyCompatibilityKey(journey: Journey): string {
  return [
    journey.trainNumber,
    journey.journeyDate,
    journey.boardingStation.code,
    journey.destinationStation.code,
    journey.travelClass,
  ].join("|");
}
