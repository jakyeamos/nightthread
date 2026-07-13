export const WANDERLOG_SAMPLE_TRIP_ID = "demo-wanderlog";

export function isPublicDemoTripId(tripId: string): boolean {
  return tripId === "demo" || tripId === WANDERLOG_SAMPLE_TRIP_ID;
}
