import type { ReactNode } from "react";
import { requireTripMember } from "@/auth/access";
import { TripShell } from "@/components/trip-shell";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (tripId !== "demo") await requireTripMember(tripId);
  return <TripShell tripId={tripId}>{children}</TripShell>;
}
