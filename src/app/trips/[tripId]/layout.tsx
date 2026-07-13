import type { ReactNode } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { requireTripMember } from "@/auth/access";
import { TripShell } from "@/components/trip-shell";
import { getDemoTripFixture } from "@/lib/demo-trips";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return <TripShell tripId={tripId} tripName={fixture.name}>{children}</TripShell>;
  await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const trip = await env.DB.prepare("select name from trips where id=?1 and deleted_at is null").bind(tripId).first<{ name: string }>();
  if (!trip) notFound();
  return <TripShell tripId={tripId} tripName={trip.name}>{children}</TripShell>;
}
