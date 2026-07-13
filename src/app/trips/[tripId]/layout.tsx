import type { ReactNode } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { requireTripMember } from "@/auth/access";
import { TripShell } from "@/components/trip-shell";
import { getDemoTripFixture } from "@/lib/demo-trips";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return <TripShell tripId={tripId} tripName={fixture.name} memberCount={4} role="collaborator">{children}</TripShell>;
  const membership = await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const [trip, members] = await Promise.all([
    env.DB.prepare("select name from trips where id=?1 and deleted_at is null").bind(tripId).first<{ name: string }>(),
    env.DB.prepare("select count(*) as count from trip_members where trip_id=?1").bind(tripId).first<{ count: number }>(),
  ]);
  if (!trip) notFound();
  return <TripShell tripId={tripId} tripName={trip.name} memberCount={members?.count ?? 1} role={membership.role}>{children}</TripShell>;
}
