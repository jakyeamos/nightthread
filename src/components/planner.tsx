"use client";
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, @next/next/no-img-element -- dnd-kit exposes callback refs and requires a client-only mount; provider images must remain hotlinked. */

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlertTriangle, ArrowLeft, ArrowRight, BedDouble, Bus, CalendarPlus, Check, ChevronDown, CircleEllipsis, Clock3, GripVertical, Lightbulb, Map as MapIcon, MapPin, Plus, Sparkles, Utensils, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPlaceholder, replacePlaceholderWithIdea, scheduleIdea } from "@/app/trips/[tripId]/actions";
import { JourneyMap } from "@/components/journey-map";
import { VoteButton } from "@/components/vote-button";
import type { WorkspaceCity, WorkspaceDay, WorkspaceIdea, WorkspaceItem } from "@/lib/demo-data";
import type { TripWorkspace } from "@/lib/demo-trips";
import { compressEmptyDayRuns, formatDuration, getDaySignals, getVisibleIdeas, groupDaysByCity } from "@/lib/planner-view";

const priorityLabel = { must_do: "Must do", would_like: "Would like", if_time: "If time" } as const;

function IdeaCard({ idea, tripId, persisted, onSchedule }: { idea: WorkspaceIdea; tripId: string; persisted: boolean; onSchedule: (idea: WorkspaceIdea) => void }) {
  const draggable = useDraggable({ id: idea.id, data: { type: "idea" }, disabled: idea.scheduled });
  return (
    <article ref={draggable.setNodeRef} style={{ transform: draggable.transform ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)` : undefined }} className={`group overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] ${draggable.isDragging ? "relative z-50 opacity-70" : ""}`}>
      <div className="relative h-28 overflow-hidden bg-[var(--indigo-soft)]">{idea.image ? <img src={idea.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <div className="grid h-full place-items-center text-[var(--indigo)]"><MapPin size={24} /><span className="sr-only">No image added</span></div>}<span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold ${idea.priority === "must_do" ? "bg-[var(--thread)] text-white" : "bg-[var(--surface-raised)] text-[var(--ink)]"}`}>{priorityLabel[idea.priority]}</span>{idea.scheduled && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-[var(--positive-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--positive)]"><Check size={11} />Scheduled</span>}{idea.imageAttribution && <a href={idea.imageAttribution.url} target="_blank" rel="noreferrer" className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1 py-0.5 text-[9px] text-white hover:bg-black/70">{idea.imageAttribution.label}</a>}</div>
      <div className="p-3"><h3 className="truncate text-sm font-semibold">{idea.name}</h3><p className="muted mt-1 truncate text-xs">{idea.detail}</p><div className="mt-3 flex items-center justify-between"><VoteButton initialCount={idea.votes} initialActive={idea.userVoted} tripId={persisted ? tripId : undefined} ideaId={persisted ? idea.id : undefined} /><div className="flex items-center"><button ref={draggable.setActivatorNodeRef} {...draggable.listeners} {...draggable.attributes} disabled={idea.scheduled} aria-label={`Drag ${idea.name} to a day`} className="grid size-8 place-items-center rounded-lg text-[var(--faint)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-30"><GripVertical size={14} /></button><button type="button" disabled={idea.scheduled} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSchedule(idea); }} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-30"><CalendarPlus size={14} />Add</button></div></div></div>
    </article>
  );
}

function ItemCard({ item, healthDismissed, onDelete, onDismissHealth, onReplace }: { item: WorkspaceItem; healthDismissed: boolean; onDelete: (item: WorkspaceItem) => void; onDismissHealth: (itemId: string) => void; onReplace: (item: WorkspaceItem) => void }) {
  const placeholder = item.kind === "placeholder";
  const travel = item.placeholderType === "travel";
  const closed = item.health === "permanently_closed" && !healthDismissed;
  return <motion.article layout="position" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className={`group relative grid grid-cols-[72px_1fr_auto] items-start gap-3 rounded-xl border p-3.5 ${travel ? "border-[oklch(0.7_0.08_235)] bg-[oklch(0.94_0.025_235)]" : placeholder ? "border-dashed border-[oklch(0.72_0.08_276)] bg-[var(--surface-soft)]" : closed ? "border-[oklch(0.77_0.1_72)] bg-[var(--warning-soft)]" : "border-[var(--line)] bg-[var(--surface-raised)]"}`}>
    <div><p className="text-sm font-semibold tabular-nums">{item.start ?? "Flexible"}</p><p className="muted mt-1 text-[10px] leading-4">{formatDuration(item)}</p></div>
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{item.title}</h3>{travel ? <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--indigo)]">Transport unresolved</span> : placeholder ? <span className="rounded-md bg-[var(--indigo-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--indigo)]">Needs decision</span> : null}</div><p className="muted mt-1 flex items-center gap-1 text-xs">{travel ? <Bus size={11} /> : placeholder ? <Sparkles size={11} /> : <MapPin size={11} />}{item.subtitle}</p><div className="mt-2 flex flex-wrap gap-2">{item.reservation === "needed" && <span className="rounded-md bg-[var(--thread-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--thread-hover)]">Reservation needed</span>}{item.reservation === "confirmed" && <span className="rounded-md bg-[var(--positive-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--positive)]">Reserved</span>}{item.cost && <span className="muted px-1 py-1 text-[10px]">{item.cost}</span>}</div>
      {closed && <div className="mt-3 rounded-lg border border-[oklch(0.77_0.1_72)] bg-white p-3" role="status"><p className="text-xs font-semibold text-[var(--warning)]">Provider marks this place permanently closed</p><p className="muted mt-1 text-[10px]">Checked {item.healthCheckedAt ?? "recently"}. Replace it or dismiss this warning.</p><div className="mt-2 flex gap-3"><button onClick={() => onReplace(item)} className="text-xs font-semibold text-[var(--indigo)] hover:text-[var(--indigo-hover)]">Find a replacement</button><button onClick={() => onDismissHealth(item.id)} className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Dismiss</button></div></div>}
    </div>
    <div className="flex items-center"><button aria-label={`Delete ${item.title}`} onClick={() => onDelete(item)} className="grid size-8 place-items-center rounded-lg text-[var(--faint)] opacity-0 transition-opacity hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] group-hover:opacity-100 focus:opacity-100"><X size={14} /></button><GripVertical className="text-[var(--faint)]" size={15} /></div>
  </motion.article>;
}

function DayColumn({ day, items, tripId, persisted, registerDay, healthDismissals, onDelete, onDismissHealth, onReplace }: { day: WorkspaceDay; items: WorkspaceItem[]; tripId: string; persisted: boolean; registerDay: (dayId: string, node: HTMLElement | null) => void; healthDismissals: ReadonlySet<string>; onDelete: (item: WorkspaceItem) => void; onDismissHealth: (itemId: string) => void; onReplace: (item: WorkspaceItem) => void }) {
  const droppable = useDroppable({ id: day.id, data: { type: "day" } });
  const setNode = useCallback((node: HTMLElement | null) => { droppable.setNodeRef(node); registerDay(day.id, node); }, [day.id, droppable, registerDay]);
  return <section ref={setNode} data-day-id={day.id} className={`scroll-mt-36 rounded-2xl border p-3 transition-colors ${droppable.isOver ? "border-[var(--indigo)] bg-[var(--indigo-soft)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
    <header className="flex items-center justify-between px-1 py-2"><div><div className="flex items-center gap-2"><span className="rounded-md bg-[var(--indigo-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--indigo)]">DAY {day.ordinal}</span><span className="muted text-xs">{day.date}</span></div><h2 className="mt-2 text-base font-semibold">{day.title}</h2></div><button aria-label={`More options for Day ${day.ordinal}`} className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]"><CircleEllipsis size={17} /></button></header>
    <div className="mt-2 space-y-2"><AnimatePresence>{items.map((item) => <ItemCard key={item.id} item={item} healthDismissed={healthDismissals.has(item.id)} onDelete={onDelete} onDismissHealth={onDismissHealth} onReplace={onReplace} />)}</AnimatePresence>{persisted ? <details className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-3"><summary className="cursor-pointer text-center text-xs font-semibold text-[var(--muted)]"><Plus className="mr-1 inline" size={14} />Add a placeholder</summary><form action={createPlaceholder.bind(null, tripId)} className="mt-3 grid gap-3 sm:grid-cols-2"><input type="hidden" name="dayId" value={day.id} /><label className="text-xs font-semibold">Type<select name="placeholderType" defaultValue="explore" className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[var(--ink)]"><option value="eat">Eat</option><option value="travel">Travel</option><option value="rest">Rest</option><option value="coffee">Coffee</option><option value="explore">Explore</option><option value="buffer">Buffer</option></select></label><label className="text-xs font-semibold">Time of day<select name="period" defaultValue="afternoon" className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[var(--ink)]"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></label><label className="text-xs font-semibold">Duration (minutes)<input name="duration" type="number" min="15" max="1440" step="15" defaultValue="60" className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[var(--ink)]" /></label><label className="text-xs font-semibold">Note<input name="notes" placeholder="What still needs deciding?" className="mt-1 h-9 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-[var(--ink)]" /></label><button className="h-9 rounded-lg bg-[var(--indigo)] px-3 text-xs font-semibold text-white sm:col-span-2">Add to Day {day.ordinal}</button></form></details> : <button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:border-[var(--faint)] hover:text-[var(--ink)]"><Plus size={14} />Add activity or placeholder</button>}</div>
  </section>;
}

function StayLabel({ city }: { city: WorkspaceCity }) {
  if (city.nights === 0) return <span className="flex items-center gap-1 text-[var(--thread-hover)]"><Bus size={12} />Transfer stop</span>;
  if (city.stayStatus === "booked") return <span className="flex items-center gap-1 text-[var(--positive)]"><BedDouble size={12} />{city.lodgingName ?? "Lodging booked"}</span>;
  if (city.stayStatus === "needs_confirmation") return <span className="flex items-center gap-1 text-[var(--warning)]"><BedDouble size={12} />Confirm lodging</span>;
  return <span className="flex items-center gap-1 text-[var(--thread-hover)]"><BedDouble size={12} />Lodging needed</span>;
}

export function Planner({ workspace }: { workspace: TripWorkspace }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="grid h-[calc(100vh-4rem)] place-items-center text-sm text-[var(--muted)]">Opening the planner…</div>;
  return <PlannerContent workspace={workspace} />;
}

function PlannerContent({ workspace }: { workspace: TripWorkspace }) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(workspace.ideas);
  const [items, setItems] = useState(workspace.items);
  const [activeDayId, setActiveDayId] = useState(workspace.days[0]?.id ?? "");
  const [allCityIdeas, setAllCityIdeas] = useState(false);
  const [toast, setToast] = useState<{ item: WorkspaceItem; deletionId?: string } | null>(null);
  const [replacementItemId, setReplacementItemId] = useState<string | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [collapsedCities, setCollapsedCities] = useState<Set<string>>(new Set());
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [healthDismissals, setHealthDismissals] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLElement | null>(null);
  const dayNodes = useRef(new Map<string, HTMLElement>());
  const explicitNavigationUntil = useRef(0);
  const reduced = useReducedMotion();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const groups = useMemo(() => groupDaysByCity(workspace.days, workspace.cities), [workspace.cities, workspace.days]);
  const activeDay = workspace.days.find((day) => day.id === activeDayId) ?? workspace.days[0];
  const activeCity = workspace.cities.find((city) => city.id === activeDay?.cityId) ?? workspace.cities[0];
  const activeGroupIndex = groups.findIndex((group) => group.city.id === activeCity?.id);
  const visibleIdeas = getVisibleIdeas(ideas, activeCity?.id ?? "", allCityIdeas);
  const signals = getDaySignals(activeDay?.id ?? "", items);
  const suggestionIdea = ideas.find((idea) => !idea.scheduled && idea.cityId === activeCity?.id);
  const travelChoices = items.filter((item) => item.placeholderType === "travel").length;
  const lodgingNeeds = workspace.cities.filter((city) => city.nights > 0 && city.stayStatus && city.stayStatus !== "booked").length;
  const mappedCities = workspace.cities.filter((city) => Number.isFinite(city.lat) && Number.isFinite(city.lon));

  useEffect(() => { setIdeas(workspace.ideas); }, [workspace.ideas]);
  useEffect(() => { setItems(workspace.items); }, [workspace.items]);

  const registerDay = useCallback((dayId: string, node: HTMLElement | null): void => {
    if (node) dayNodes.current.set(dayId, node);
    else dayNodes.current.delete(dayId);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let frame = 0;
    const updateActiveDay = (): void => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (Date.now() < explicitNavigationUntil.current) return;
        const bottomGap = container.scrollHeight - container.scrollTop - container.clientHeight;
        const lastRenderedDay = [...workspace.days].reverse().find((day) => dayNodes.current.has(day.id));
        if (bottomGap < 8 && lastRenderedDay) {
          setActiveDayId((current) => current === lastRenderedDay.id ? current : lastRenderedDay.id);
          return;
        }
        const anchor = container.getBoundingClientRect().top + 150;
        let closestId = activeDayId;
        let closestDistance = Number.POSITIVE_INFINITY;
        for (const day of workspace.days) {
          const node = dayNodes.current.get(day.id);
          if (!node) continue;
          const distance = Math.abs(node.getBoundingClientRect().top - anchor);
          if (distance < closestDistance) { closestDistance = distance; closestId = day.id; }
        }
        setActiveDayId((current) => current === closestId ? current : closestId);
      });
    };
    updateActiveDay();
    container.addEventListener("scroll", updateActiveDay, { passive: true });
    return () => { window.cancelAnimationFrame(frame); container.removeEventListener("scroll", updateActiveDay); };
  }, [activeDayId, workspace.days]);

  function runContaining(dayId: string): string | undefined {
    for (const group of groups) {
      const entry = compressEmptyDayRuns(group.days, items).find((candidate) => candidate.kind === "empty_run" && candidate.days.some((day) => day.id === dayId));
      if (entry?.kind === "empty_run") return entry.id;
    }
    return undefined;
  }

  function jumpToDay(dayId: string): void {
    const day = workspace.days.find((candidate) => candidate.id === dayId);
    if (!day) return;
    setActiveDayId(dayId);
    explicitNavigationUntil.current = Date.now() + 500;
    setCollapsedCities((current) => { const next = new Set(current); next.delete(day.cityId); return next; });
    const runId = runContaining(dayId);
    if (runId) setExpandedRuns((current) => new Set(current).add(runId));
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => dayNodes.current.get(dayId)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })));
  }

  function jumpToCity(index: number): void {
    const group = groups[index];
    if (group?.days[0]) jumpToDay(group.days[0].id);
  }

  function schedule(idea: WorkspaceIdea, dayId = activeDay?.id ?? workspace.days[0]?.id): void {
    if (!dayId || idea.scheduled) return;
    const replacement = replacementItemId ? items.find((item) => item.id === replacementItemId) : undefined;
    setIdeas((current) => current.map((entry) => entry.id === idea.id ? { ...entry, scheduled: true } : entry));
    setItems((current) => replacement ? current.map((entry) => entry.id === replacement.id ? { ...entry, title: idea.name, subtitle: idea.detail.split(" · ")[0], kind: "activity", placeholderType: undefined, ideaId: idea.id } : entry) : [...current, { id: `scheduled-${idea.id}`, dayId, title: idea.name, subtitle: idea.detail.split(" · ")[0], start: "17:00", duration: 90, durationSource: "estimate", kind: "activity", ideaId: idea.id }]);
    setReplacementItemId(null);
    if (workspace.persistence === "d1") void (replacement ? replacePlaceholderWithIdea(workspace.id, replacement.id, idea.id) : scheduleIdea(workspace.id, idea.id, dayId)).then(() => router.refresh()).catch(() => {
      setIdeas((current) => current.map((entry) => entry.id === idea.id ? { ...entry, scheduled: false } : entry));
      setItems(workspace.items);
    });
  }

  function dragEnd(event: DragEndEvent): void {
    const idea = ideas.find((entry) => entry.id === String(event.active.id));
    if (idea && event.over?.data.current?.type === "day") schedule(idea, String(event.over.id));
  }

  function remove(item: WorkspaceItem): void {
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setToast({ item });
    if (workspace.persistence === "d1") void fetch(`/api/trips/${encodeURIComponent(workspace.id)}/deletions`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetKind: "itinerary_item", targetId: item.id }) }).then(async (response) => {
      if (!response.ok) throw new Error("DELETE_FAILED");
      const result = await response.json() as { deletionId: string };
      setToast((current) => current?.item.id === item.id ? { ...current, deletionId: result.deletionId } : current);
    }).catch(() => { setItems((current) => [...current, item]); setToast(null); });
    window.setTimeout(() => setToast((current) => current?.item.id === item.id ? null : current), 10_000);
  }
  function undo(): void {
    if (!toast) return;
    if (workspace.persistence === "d1" && !toast.deletionId) return;
    const current = toast;
    setItems((itemsNow) => [...itemsNow, current.item]);
    setToast(null);
    if (workspace.persistence === "d1" && current.deletionId) void fetch(`/api/trips/${encodeURIComponent(workspace.id)}/deletions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deletionId: current.deletionId }) }).then((response) => { if (!response.ok) throw new Error("UNDO_FAILED"); router.refresh(); }).catch(() => setItems((itemsNow) => itemsNow.filter((item) => item.id !== current.item.id)));
  }
  function replace(item: WorkspaceItem): void { if (workspace.persistence === "d1") setReplacementItemId(item.id); else remove(item); setAllCityIdeas(false); setIdeasOpen(true); }

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
    <main className="grid h-[calc(100vh-4rem)] min-h-[680px] xl:grid-cols-[300px_minmax(520px,1fr)_360px]">
      <aside className={`${ideasOpen ? "fixed inset-y-16 left-0 z-40 block w-[300px] shadow-[0_8px_18px_oklch(0.35_0.04_245/.16)]" : "hidden"} overflow-y-auto border-r border-[var(--line)] bg-[var(--surface-soft)] p-4 xl:static xl:block xl:w-auto xl:shadow-none`}>
        <div className="flex items-center justify-between"><div><p className="eyebrow">Discovery rail</p><h2 className="mt-1 text-lg font-semibold">Saved ideas</h2></div><button aria-label="Close saved ideas" className="xl:hidden" onClick={() => setIdeasOpen(false)}><X size={18} /></button></div>
        <div className="mt-4 grid grid-cols-2 rounded-xl bg-[var(--surface)] p-1" aria-label="Saved idea city filter"><button aria-pressed={!allCityIdeas} onClick={() => setAllCityIdeas(false)} className={`rounded-lg px-2 py-2 text-xs font-semibold ${!allCityIdeas ? "bg-[var(--indigo)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}>{activeCity?.name ?? "Current city"} · {ideas.filter((idea) => idea.cityId === activeCity?.id).length}</button><button aria-pressed={allCityIdeas} onClick={() => setAllCityIdeas(true)} className={`rounded-lg px-2 py-2 text-xs font-semibold ${allCityIdeas ? "bg-[var(--indigo)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}>All cities · {ideas.length}</button></div>
        <div className="mt-4 space-y-3">{visibleIdeas.length > 0 ? visibleIdeas.map((idea) => <IdeaCard key={idea.id} idea={idea} tripId={workspace.id} persisted={workspace.persistence === "d1"} onSchedule={schedule} />) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-4 text-center"><p className="text-sm font-semibold">No saved ideas here yet</p><p className="muted mt-1 text-xs">Add a place for {activeCity?.name ?? "this city"}, or view all cities.</p></div>}</div>
        <Link href={`/trips/${workspace.id}/ideas#add-idea`} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--ink)]"><Plus size={14} />Add a place manually</Link>
        {workspace.source && <a href={workspace.source.url} target="_blank" rel="noreferrer" className="muted mt-4 block text-[10px] underline underline-offset-2">{workspace.source.label}</a>}
      </aside>

      <section ref={scrollRef} className="overflow-y-auto bg-[var(--canvas)]">
        <header data-active-city={activeCity?.id} data-active-day={activeDay?.id} className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="truncate text-lg font-semibold">{activeCity?.name ?? workspace.name}</h1><span className="rounded-md bg-[var(--indigo-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--indigo)]">Day {activeDay?.ordinal ?? 1}</span></div><p className="muted mt-0.5 truncate text-xs">{activeDay?.date} · {activeCity?.timeZone ?? workspace.timeZoneLabel}</p></div><div className="ml-auto flex gap-2"><button onClick={() => setIdeasOpen(true)} className="grid size-9 place-items-center rounded-lg surface xl:hidden" title="Open saved ideas"><Lightbulb size={16} /></button><button onClick={() => setAssistantOpen(true)} className="grid size-9 place-items-center rounded-lg surface xl:hidden" title="Open map and suggestions"><MapIcon size={16} /></button></div></div>
          <nav className="mt-3 flex items-center gap-2" aria-label="Trip day navigation"><button aria-label="Previous city" disabled={activeGroupIndex <= 0} onClick={() => jumpToCity(activeGroupIndex - 1)} className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:cursor-default disabled:opacity-35"><ArrowLeft size={14} /></button><div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1">{groups.map((group, index) => <button key={`${group.city.id}-${index}`} onClick={() => jumpToCity(index)} aria-current={group.city.id === activeCity?.id ? "location" : undefined} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${group.city.id === activeCity?.id ? "bg-[var(--indigo)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-soft)]"}`}>{group.city.name} · {group.days[0].ordinal}{group.days.length > 1 ? `–${group.days.at(-1)?.ordinal}` : ""}</button>)}</div><select aria-label="Jump to day" value={activeDay?.id} onChange={(event) => jumpToDay(event.target.value)} className="h-8 max-w-[104px] rounded-lg border border-[var(--line)] bg-white px-2 text-xs font-semibold text-[var(--ink)]">{workspace.days.map((day) => <option key={day.id} value={day.id}>Day {day.ordinal}</option>)}</select><button aria-label="Next city" disabled={activeGroupIndex >= groups.length - 1} onClick={() => jumpToCity(activeGroupIndex + 1)} className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-soft)] disabled:cursor-default disabled:opacity-35"><ArrowRight size={14} /></button></nav>
        </header>
        <div className="mx-auto max-w-3xl space-y-7 p-4 md:p-7">{groups.map((group, groupIndex) => {
          const collapsed = collapsedCities.has(group.city.id);
          const entries = compressEmptyDayRuns(group.days, items);
          return <section key={`${group.city.id}-${groupIndex}`} aria-labelledby={`city-${group.city.id}-${groupIndex}`}><div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-3"><div><p className="eyebrow">Days {group.days[0].ordinal}{group.days.length > 1 ? `–${group.days.at(-1)?.ordinal}` : ""}</p><h2 id={`city-${group.city.id}-${groupIndex}`} className="mt-1 text-lg font-semibold">{group.city.name}</h2><p className="muted mt-1 text-xs"><StayLabel city={group.city} /></p></div><button aria-expanded={!collapsed} onClick={() => setCollapsedCities((current) => { const next = new Set(current); if (next.has(group.city.id)) next.delete(group.city.id); else next.add(group.city.id); return next; })} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]">{collapsed ? "Expand" : "Collapse"}<ChevronDown className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} size={14} /></button></div>{collapsed ? <button onClick={() => setCollapsedCities((current) => { const next = new Set(current); next.delete(group.city.id); return next; })} className="flex w-full items-center justify-between rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-4 text-left"><span><strong className="text-sm">{group.days.length} day{group.days.length === 1 ? "" : "s"} collapsed</strong><span className="muted ml-2 text-xs">{group.city.name}</span></span><ArrowRight size={15} /></button> : <div className="space-y-5">{entries.map((entry) => {
            if (entry.kind === "day") return <DayColumn key={entry.day.id} day={entry.day} items={items.filter((item) => item.dayId === entry.day.id)} tripId={workspace.id} persisted={workspace.persistence === "d1"} registerDay={registerDay} healthDismissals={healthDismissals} onDelete={remove} onDismissHealth={(itemId) => setHealthDismissals((current) => new Set(current).add(itemId))} onReplace={replace} />;
            const expanded = expandedRuns.has(entry.id);
            if (expanded) return <div key={entry.id} className="space-y-5">{entry.days.map((day) => <DayColumn key={day.id} day={day} items={[]} tripId={workspace.id} persisted={workspace.persistence === "d1"} registerDay={registerDay} healthDismissals={healthDismissals} onDelete={remove} onDismissHealth={(itemId) => setHealthDismissals((current) => new Set(current).add(itemId))} onReplace={replace} />)}<button onClick={() => setExpandedRuns((current) => { const next = new Set(current); next.delete(entry.id); return next; })} className="mx-auto block rounded-lg px-3 py-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface)]">Compress open days</button></div>;
            return <section key={entry.id} ref={(node) => registerDay(entry.days[0].id, node)} className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface-soft)] p-5"><div className="flex items-center justify-between gap-4"><div><p className="eyebrow">Days {entry.days[0].ordinal}–{entry.days.at(-1)?.ordinal}</p><h3 className="mt-1 text-base font-semibold">{entry.days.length} open days in {group.city.name}</h3><p className="muted mt-1 text-xs">Keep them flexible, or expand to plan each day.</p></div><button onClick={() => setExpandedRuns((current) => new Set(current).add(entry.id))} className="shrink-0 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--indigo)] hover:bg-white">Plan these days</button></div></section>;
          })}</div>}</section>;
        })}</div>
      </section>

      <aside className={`${assistantOpen ? "fixed inset-y-16 right-0 z-40 block w-[360px] shadow-[0_8px_18px_oklch(0.35_0.04_245/.16)]" : "hidden"} overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] xl:static xl:block xl:w-auto xl:shadow-none`}>
        <div className="h-[250px] border-b border-[var(--line)]">{mappedCities.length > 0 ? <JourneyMap cities={mappedCities} tripId={workspace.id} compact /> : <div className="grid h-full place-items-center bg-[var(--surface-soft)] px-6 text-center"><p className="muted text-xs">Add city coordinates in settings to draw the route.</p></div>}</div>
        <div className="p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Planning signals · Day {activeDay?.ordinal ?? 1}</p><h2 className="mt-1 text-lg font-semibold">{signals.totalMinutes > 360 ? "A full day" : signals.totalMinutes > 0 ? "A lighter day" : "A day with room"}</h2></div><button aria-label="Close planning signals" className="xl:hidden" onClick={() => setAssistantOpen(false)}><X size={18} /></button></div>
          <article className="mt-5 rounded-xl bg-[var(--indigo-soft)] p-4"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[var(--indigo)]"><Clock3 size={16} /></span><div><h3 className="text-sm font-semibold">Day {activeDay?.ordinal ?? 1} {signals.totalMinutes > 360 ? "has a lot in it" : "has room"}</h3><p className="muted mt-1 text-xs leading-5">{signals.totalMinutes} known minutes planned{signals.unknownDurations > 0 ? ` · ${signals.unknownDurations} duration${signals.unknownDurations === 1 ? "" : "s"} open` : ""}. {signals.totalMinutes > 360 ? "Check transfers and recovery time before adding more." : `${suggestionIdea?.name ?? "Another idea"} may still fit.`}</p>{suggestionIdea && signals.totalMinutes <= 360 && <button onClick={() => schedule(suggestionIdea)} className="mt-3 text-xs font-semibold text-[var(--indigo)] hover:text-[var(--indigo-hover)]">Add to Day {activeDay?.ordinal ?? 1} →</button>}</div></div></article>
          {signals.reservationNeeded && <article className="mt-3 rounded-xl border border-[var(--line)] p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-[var(--warning)]" size={17} /><div><h3 className="text-sm font-semibold">Reservation to make</h3><p className="muted mt-1 text-xs leading-5">{signals.reservationNeeded.title} is scheduled, but not reserved yet.</p><button className="mt-3 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Mark reserved</button></div></div></article>}
          {signals.openDecisions > 0 && <article className="mt-3 rounded-xl border border-[var(--line)] p-4"><div className="flex gap-3"><Utensils className="mt-0.5 shrink-0 text-[var(--thread)]" size={17} /><div><h3 className="text-sm font-semibold">{signals.openDecisions} open decision{signals.openDecisions === 1 ? "" : "s"} today</h3><p className="muted mt-1 text-xs leading-5">Travel, recovery, or buffer placeholders on Day {activeDay?.ordinal ?? 1} still need review.</p></div></div></article>}
          {signals.closedPlaces.length > 0 && <article className="mt-3 rounded-xl border border-[oklch(0.77_0.1_72)] bg-[var(--warning-soft)] p-4"><h3 className="text-sm font-semibold">Closed place on this day</h3><p className="muted mt-1 text-xs">Replace or dismiss it in the itinerary.</p></article>}
          <section className="mt-5 border-t border-[var(--line)] pt-4" aria-label="Trip-wide issues"><p className="eyebrow">Across the trip</p><div className="mt-2 grid grid-cols-2 gap-2"><div className="rounded-lg bg-[var(--surface-soft)] p-3"><strong className="text-lg">{travelChoices}</strong><p className="muted mt-1 text-[10px]">transport choices open</p></div><div className="rounded-lg bg-[var(--surface-soft)] p-3"><strong className="text-lg">{lodgingNeeds}</strong><p className="muted mt-1 text-[10px]">stays need lodging</p></div></div></section>
          <p className="muted mt-5 text-[10px] leading-4">Suggestions are deterministic and based only on your itinerary, distances, and time windows.</p>
        </div>
      </aside>
    </main>
    <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: reduced ? 0 : .18 }} className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-4 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--ink)] shadow-[0_6px_16px_oklch(0.35_0.04_245/.18)]"><span>Removed {toast.item.title}</span><button disabled={workspace.persistence === "d1" && !toast.deletionId} onClick={undo} className="font-bold text-[var(--indigo)] underline underline-offset-2 disabled:opacity-40">Undo</button></motion.div>}</AnimatePresence>
  </DndContext>;
}
