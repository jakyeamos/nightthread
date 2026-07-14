import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Clock3 } from "lucide-react";
import { requireTripMember } from "@/auth/access";
import { getDemoTripFixture } from "@/lib/demo-trips";
import { demoActivity } from "@/lib/demo-data";

interface EventRow {
  id: string;
  actor: string | null;
  action: string;
  entityKind: string;
  after: string | Record<string, unknown> | null;
  createdAt: number;
}

function eventCopy(event: EventRow): string {
  const after = typeof event.after === "string" ? JSON.parse(event.after) as Record<string, unknown> : event.after;
  const name = typeof after?.name === "string" ? after.name : null;
  const labels: Record<string, string> = {
    created: event.entityKind === "trip" ? "created the trip" : `added ${name ?? event.entityKind.replace("_", " ")}`,
    updated: "updated the trip details",
    days_created: `created ${String(after?.dayCount ?? "the")} planning days`,
    scheduled: `scheduled ${name ?? "an idea"}`,
    manual_activity_created: `added ${name ?? "an activity"} to the itinerary`,
    day_updated: `named Day ${String(after?.dayOrdinal ?? "")} ${name ?? ""}`.trim(),
    placeholder_created: `added a ${String(after?.placeholderType ?? "planning")} placeholder`,
    placeholder_replaced: `replaced a placeholder with ${name ?? "a saved idea"}`,
    voted: `voted for ${name ?? "a saved idea"}`,
    unvoted: `removed a vote from ${name ?? "a saved idea"}`,
    moved: `moved ${name ?? "a city stop"}`,
    city_updated: `updated ${name ?? "a city stop"}`,
    days_assigned: `assigned ${name ?? "a city"} from Day ${String(after?.startDay ?? "")}`,
    night_saved: after?.kind === "travel" ? `set overnight travel from ${String(after?.fromCityName ?? "one city")} to ${String(after?.toCityName ?? "another")}` : `set a stay in ${String(after?.cityName ?? "the destination")}`,
  };
  return labels[event.action] ?? `${event.action.replaceAll("_", " ")} ${event.entityKind.replaceAll("_", " ")}`;
}

export default async function ActivityPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const fixture = getDemoTripFixture(tripId);
  if (fixture) return <ActivityList events={demoActivity.map(([actor, action, time], index) => ({ id: String(index), actor, action, displayTime: time }))} />;
  await requireTripMember(tripId);
  const { env } = getCloudflareContext();
  const rows = await env.DB.prepare(`select ae.id,u.name as actor,ae.action,ae.entity_kind as entityKind,ae.after,ae.created_at as createdAt from activity_events ae left join user u on u.id=ae.actor_user_id where ae.trip_id=?1 order by ae.created_at desc,ae.id desc limit 100`).bind(tripId).all<EventRow>();
  return <ActivityList events={rows.results.map((event) => ({ id: event.id, actor: event.actor ?? "Former member", action: eventCopy(event), displayTime: new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt)), dateTime: new Date(event.createdAt).toISOString() }))} />;
}

function ActivityList({ events }: { events: Array<{ id: string; actor: string; action: string; displayTime: string; dateTime?: string }> }) {
  return <main className="mx-auto max-w-4xl px-6 py-12"><p className="eyebrow">Shared history</p><h1 className="display mt-2 text-5xl">Activity</h1><p className="muted mt-3">A compact record of what changed, without noisy notifications.</p>{events.length > 0 ? <div className="mt-10">{events.map((event, index) => <article key={event.id} className="relative grid grid-cols-[38px_1fr_auto] gap-4 border-b border-[var(--line)] py-5"><span className="grid size-9 place-items-center rounded-full bg-[var(--indigo-soft)] text-xs font-semibold">{event.actor[0]}</span><p className="text-sm"><strong>{event.actor}</strong> <span className="muted">{event.action}</span></p><time dateTime={event.dateTime} className="muted flex items-center gap-1 text-xs"><Clock3 size={12} />{event.displayTime}</time>{index < events.length - 1 && <span className="absolute bottom-[-1px] left-[17px] top-[56px] w-px bg-[var(--line)]" />}</article>)}</div> : <section className="mt-10 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] py-14 text-center"><h2 className="text-lg font-semibold">No changes yet</h2><p className="muted mt-2 text-sm">Trip edits will appear here.</p></section>}</main>;
}
