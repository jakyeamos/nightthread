"use client";
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, @next/next/no-img-element -- dnd-kit exposes callback refs and requires a client-only mount; provider images must remain hotlinked. */

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlertTriangle, CalendarPlus, Check, ChevronDown, CircleEllipsis, Clock3, GripVertical, Lightbulb, Map, MapPin, Plus, Sparkles, Utensils, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { JourneyMap } from "@/components/journey-map";
import { VoteButton } from "@/components/vote-button";
import { demoCities, demoDays, demoIdeas, demoItems, type DemoIdea, type DemoItem } from "@/lib/demo-data";

const priorityLabel = { must_do: "Must do", would_like: "Would like", if_time: "If time" } as const;

function IdeaCard({ idea, onSchedule }: { idea: DemoIdea; onSchedule: (idea: DemoIdea) => void }) {
  const draggable = useDraggable({ id: idea.id, data: { type: "idea" }, disabled: idea.scheduled });
  return (
    <article ref={draggable.setNodeRef} style={{ transform: draggable.transform ? `translate3d(${draggable.transform.x}px, ${draggable.transform.y}px, 0)` : undefined }} className={`group overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-raised)] ${draggable.isDragging ? "relative z-50 opacity-70" : ""}`}>
      <div className="relative h-28 overflow-hidden"><img src={idea.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /><span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold ${idea.priority === "must_do" ? "bg-[var(--thread)] text-white" : "bg-black/70 text-white"}`}>{priorityLabel[idea.priority]}</span>{idea.scheduled && <span className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-[var(--positive-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--positive)]"><Check size={11} />Scheduled</span>}<a href="https://unsplash.com" target="_blank" rel="noreferrer" className="absolute bottom-1.5 right-2 rounded bg-black/55 px-1 py-0.5 text-[9px] text-white hover:bg-black/70">Unsplash</a></div>
      <div className="p-3"><h3 className="truncate text-sm font-semibold">{idea.name}</h3><p className="muted mt-1 truncate text-xs">{idea.detail}</p><div className="mt-3 flex items-center justify-between"><VoteButton initialCount={idea.votes} /><div className="flex items-center"><button ref={draggable.setActivatorNodeRef} {...draggable.listeners} {...draggable.attributes} disabled={idea.scheduled} aria-label={`Drag ${idea.name} to a day`} className="grid size-8 place-items-center rounded-lg text-[var(--faint)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-30"><GripVertical size={14} /></button><button type="button" disabled={idea.scheduled} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onSchedule(idea); }} className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] disabled:opacity-30"><CalendarPlus size={14} />Add</button></div></div></div>
    </article>
  );
}

function ItemCard({ item, onDelete }: { item: DemoItem; onDelete: (item: DemoItem) => void }) {
  const placeholder = item.kind === "placeholder";
  return <motion.article layout initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className={`group relative grid grid-cols-[60px_1fr_auto] items-start gap-3 rounded-xl border p-3.5 ${placeholder ? "border-dashed border-[oklch(0.72_0.08_276)] bg-[var(--surface-soft)]" : "border-[var(--line)] bg-[var(--surface-raised)]"}`}>
    <div><p className="text-sm font-semibold tabular-nums">{item.start}</p><p className="muted mt-1 text-[10px]">{item.duration} min</p></div>
    <div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold">{item.title}</h3>{placeholder && <span className="rounded-md bg-[var(--indigo-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--indigo)]">Open</span>}</div><p className="muted mt-1 flex items-center gap-1 text-xs">{placeholder ? <Sparkles size={11} /> : <MapPin size={11} />}{item.subtitle}</p><div className="mt-2 flex flex-wrap gap-2">{item.reservation === "needed" && <span className="rounded-md bg-[var(--thread-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--thread-hover)]">Reservation needed</span>}{item.reservation === "confirmed" && <span className="rounded-md bg-[var(--positive-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--positive)]">Reserved</span>}{item.cost && <span className="muted px-1 py-1 text-[10px]">{item.cost}</span>}</div></div>
    <div className="flex items-center"><button aria-label={`Delete ${item.title}`} onClick={() => onDelete(item)} className="grid size-8 place-items-center rounded-lg text-[var(--faint)] opacity-0 transition-opacity hover:bg-[var(--surface-soft)] hover:text-[var(--ink)] group-hover:opacity-100 focus:opacity-100"><X size={14} /></button><GripVertical className="text-[var(--faint)]" size={15} /></div>
  </motion.article>;
}

function DayColumn({ day, items, onDelete }: { day: typeof demoDays[number]; items: DemoItem[]; onDelete: (item: DemoItem) => void }) {
  const droppable = useDroppable({ id: day.id, data: { type: "day" } });
  return <section ref={droppable.setNodeRef} className={`rounded-2xl border p-3 transition-colors ${droppable.isOver ? "border-[var(--indigo)] bg-[var(--indigo-soft)]" : "border-[var(--line)] bg-[var(--surface)]"}`}>
    <header className="flex items-center justify-between px-1 py-2"><div><div className="flex items-center gap-2"><span className="rounded-md bg-[var(--indigo-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--indigo)]">DAY {day.ordinal}</span><span className="muted text-xs">{day.date}</span></div><h2 className="mt-2 text-base font-semibold">{day.title}</h2></div><button className="grid size-8 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--surface-soft)]"><CircleEllipsis size={17} /></button></header>
    <div className="mt-2 space-y-2"><AnimatePresence>{items.map((item) => <ItemCard key={item.id} item={item} onDelete={onDelete} />)}</AnimatePresence><button className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:border-[var(--faint)] hover:text-[var(--ink)]"><Plus size={14} />Add activity or placeholder</button></div>
  </section>;
}

export function Planner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="grid h-[calc(100vh-4rem)] place-items-center text-sm text-[var(--muted)]">Opening the planner…</div>;
  return <PlannerContent />;
}

function PlannerContent() {
  const [ideas, setIdeas] = useState(demoIdeas);
  const [items, setItems] = useState(demoItems);
  const [toast, setToast] = useState<DemoItem | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const reduced = useReducedMotion();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function schedule(idea: DemoIdea, dayId = "day-2"): void {
    if (idea.scheduled) return;
    setIdeas((current) => current.map((entry) => entry.id === idea.id ? { ...entry, scheduled: true } : entry));
    setItems((current) => [...current, { id: `scheduled-${idea.id}`, dayId, title: idea.name, subtitle: idea.detail.split(" · ")[0], start: "17:00", duration: 90, kind: "activity", ideaId: idea.id }]);
  }
  function dragEnd(event: DragEndEvent): void {
    const idea = ideas.find((entry) => entry.id === String(event.active.id));
    if (idea && event.over?.data.current?.type === "day") schedule(idea, String(event.over.id));
  }
  function remove(item: DemoItem): void { setItems((current) => current.filter((entry) => entry.id !== item.id)); setToast(item); window.setTimeout(() => setToast((current) => current?.id === item.id ? null : current), 10_000); }
  function undo(): void { if (toast) setItems((current) => [...current, toast]); setToast(null); }
  const totalMinutes = useMemo(() => items.filter((item) => item.dayId === "day-2").reduce((sum, item) => sum + item.duration, 0), [items]);

  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}>
    <main className="grid h-[calc(100vh-4rem)] min-h-[680px] xl:grid-cols-[300px_minmax(520px,1fr)_360px]">
      <aside className={`${ideasOpen ? "fixed inset-y-16 left-0 z-40 block w-[300px] shadow-[0_8px_18px_oklch(0.35_0.04_245/.16)]" : "hidden"} overflow-y-auto border-r border-[var(--line)] bg-[var(--surface-soft)] p-4 xl:static xl:block xl:w-auto xl:shadow-none`}>
        <div className="flex items-center justify-between"><div><p className="eyebrow">Discovery rail</p><h2 className="mt-1 text-lg font-semibold">Saved ideas</h2></div><button className="xl:hidden" onClick={() => setIdeasOpen(false)}><X size={18} /></button></div>
        <div className="mt-4 flex gap-2"><button className="rounded-lg bg-[var(--indigo)] px-3 py-2 text-xs text-white">Tokyo · 4</button><button className="rounded-lg px-3 py-2 text-xs text-[var(--muted)] hover:bg-white">All cities</button></div>
        <div className="mt-4 space-y-3">{ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onSchedule={schedule} />)}</div>
        <button className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--ink)]"><Plus size={14} />Add a place manually</button>
      </aside>

      <section className="overflow-y-auto bg-[var(--canvas)]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center border-b border-[var(--line)] bg-[var(--surface)] px-5 md:px-7"><div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold">Tokyo</h1><ChevronDown size={15} className="text-[var(--muted)]" /></div><p className="muted mt-0.5 text-xs">Oct 12–15 · Japan Standard Time</p></div><div className="ml-auto flex gap-2"><button onClick={() => setIdeasOpen(true)} className="grid size-9 place-items-center rounded-lg surface xl:hidden" title="Open saved ideas"><Lightbulb size={16} /></button><button onClick={() => setAssistantOpen(true)} className="grid size-9 place-items-center rounded-lg surface xl:hidden" title="Open map and suggestions"><Map size={16} /></button><div className="hidden items-center -space-x-2 md:flex">{["M","J","P"].map((name,index) => <span key={name} className={`grid size-8 place-items-center rounded-full border-2 border-[var(--surface)] text-[10px] font-bold text-white ${index === 0 ? "bg-[oklch(0.52_0.11_18)]" : index === 1 ? "bg-[oklch(0.43_0.1_285)]" : "bg-[oklch(0.43_0.1_160)]"}`}>{name}</span>)}</div></div></header>
        <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-7">{demoDays.map((day) => <DayColumn key={day.id} day={day} items={items.filter((item) => item.dayId === day.id)} onDelete={remove} />)}</div>
      </section>

      <aside className={`${assistantOpen ? "fixed inset-y-16 right-0 z-40 block w-[360px] shadow-[0_8px_18px_oklch(0.35_0.04_245/.16)]" : "hidden"} overflow-y-auto border-l border-[var(--line)] bg-[var(--surface)] xl:static xl:block xl:w-auto xl:shadow-none`}>
        <div className="h-[250px] border-b border-[var(--line)]"><JourneyMap cities={demoCities} tripId="demo" compact /></div>
        <div className="p-5"><div className="flex items-center justify-between"><div><p className="eyebrow">Planning signals</p><h2 className="mt-1 text-lg font-semibold">A lighter day</h2></div><button className="xl:hidden" onClick={() => setAssistantOpen(false)}><X size={18} /></button></div>
          <article className="mt-5 rounded-xl bg-[var(--indigo-soft)] p-4"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white text-[var(--indigo)]"><Clock3 size={16} /></span><div><h3 className="text-sm font-semibold">Day 2 has room</h3><p className="muted mt-1 text-xs leading-5">{totalMinutes} minutes planned. Nezu Museum fits well before teamLab.</p><button onClick={() => schedule(ideas[3])} className="mt-3 text-xs font-semibold text-[var(--indigo)] hover:text-[var(--indigo-hover)]">Add to Day 2 →</button></div></div></article>
          <article className="mt-3 rounded-xl border border-[var(--line)] p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-[var(--warning)]" size={17} /><div><h3 className="text-sm font-semibold">Reservation to make</h3><p className="muted mt-1 text-xs leading-5">teamLab Borderless is scheduled, but not reserved yet.</p><button className="mt-3 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]">Mark reserved</button></div></div></article>
          <article className="mt-3 rounded-xl border border-[var(--line)] p-4"><div className="flex gap-3"><Utensils className="mt-0.5 shrink-0 text-[var(--thread)]" size={17} /><div><h3 className="text-sm font-semibold">Two open decisions</h3><p className="muted mt-1 text-xs leading-5">Lunch on Day 1 and coffee on Day 2 are still placeholders.</p></div></div></article>
          <p className="muted mt-5 text-[10px] leading-4">Suggestions are deterministic and based only on your itinerary, distances, and time windows.</p>
        </div>
      </aside>
    </main>
    <AnimatePresence>{toast && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: reduced ? 0 : .18 }} className="fixed bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-4 rounded-xl bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--ink)] shadow-[0_6px_16px_oklch(0.35_0.04_245/.18)]"><span>Removed {toast.title}</span><button onClick={undo} className="font-bold text-[var(--indigo)] underline underline-offset-2">Undo</button></motion.div>}</AnimatePresence>
  </DndContext>;
}
