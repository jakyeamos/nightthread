import { Planner } from "@/components/planner";
import { getDemoTripFixture, tokyoDemoTrip } from "@/lib/demo-trips";

export default async function PlannerPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <Planner fixture={getDemoTripFixture(tripId) ?? tokyoDemoTrip} />;
}
