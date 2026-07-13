import { Planner } from "@/components/planner";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTripMember } from "@/auth/access";
import { createDaysFromTripDates } from "@/app/trips/[tripId]/actions";
import { getDemoTripFixture } from "@/lib/demo-trips";
import { loadTripWorkspace } from "@/lib/trip-workspace";

export default async function PlannerPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return <Planner workspace={fixture} />;
  const { user } = await requireTripMember(tripId);
  const workspace = await loadTripWorkspace(tripId, user);
  if (!workspace) notFound();
  if (workspace.days.length === 0) {
    return <main className="grid min-h-[calc(100vh-4rem)] place-items-center px-6"><section className="max-w-lg rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center"><p className="eyebrow">Planner setup</p><h1 className="display mt-3 text-5xl">Build the trip days</h1><p className="muted mt-3 text-sm leading-6">This trip was created before automatic day setup was available. Build its stable day ordinals from the saved dates, then assign city stops.</p><form action={createDaysFromTripDates.bind(null, tripId)}><button className="mt-6 h-11 rounded-xl bg-[var(--indigo)] px-5 text-sm font-semibold text-white">Create {workspace.startDate && workspace.endDate ? workspace.dateLabel : "Day 1"}</button></form><Link href={`/trips/${tripId}/settings`} className="mt-4 block text-xs font-semibold text-[var(--indigo)]">Review trip settings</Link></section></main>;
  }
  return <Planner workspace={workspace} />;
}
