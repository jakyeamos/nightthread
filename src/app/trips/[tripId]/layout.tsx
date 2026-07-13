import type { ReactNode } from "react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound } from "next/navigation";
import { requireTripMember } from "@/auth/access";
import { TripShell } from "@/components/trip-shell";

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (tripId === "demo") return <TripShell tripId={tripId} tripName="Tokyo after dark">{children}</TripShell>;
  await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const trip = await env.DB.prepare("select name from trips where id=?1 and deleted_at is null").bind(tripId).first<{ name: string }>();
  if (!trip) notFound();
  return <TripShell tripId={tripId} tripName={trip.name}>{children}</TripShell>;
}
