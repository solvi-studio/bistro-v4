import type {
  CalendarEvent,
  EnrichedCalendarEvent,
  PlanPhase,
} from "@/types/plan";
import { notifyDataChange } from "@/utils/dataSync";
import { storage } from "@/utils/storage";

// Calendar-events repo — events are stored per folder (creative script), one
// key per script, through the shared storage seam. Mirrors mind-map-store so a
// later swap to a DB (calendar_events.script_id) touches one adapter. The
// calendar page aggregates across all scripts via getAllEvents().

const PREFIX = "bistro_calendar_events_";
const key = (scriptId: string) => `${PREFIX}${scriptId}`;

export function loadEvents(scriptId: string): CalendarEvent[] {
  return storage.read<CalendarEvent[]>(key(scriptId), []);
}

export function saveEvents(scriptId: string, events: CalendarEvent[]): void {
  storage.write(key(scriptId), events);
  // Tell other mounted views (e.g. the plan page) to re-read.
  notifyDataChange();
}

export function addEvent(
  scriptId: string,
  input: {
    date: string;
    title: string;
    notes?: string[];
    time?: string;
    endTime?: string;
    location?: string;
    reminders?: string[];
  },
): CalendarEvent {
  const event: CalendarEvent = {
    id: `evt-${Date.now()}`,
    scriptId,
    date: input.date,
    time: input.time,
    endTime: input.endTime,
    title: input.title,
    notes: input.notes ?? [],
    location: input.location,
    reminders: input.reminders,
  };
  saveEvents(scriptId, [...loadEvents(scriptId), event]);
  return event;
}

export function updateEvent(scriptId: string, event: CalendarEvent): void {
  saveEvents(
    scriptId,
    loadEvents(scriptId).map((e) => (e.id === event.id ? event : e)),
  );
}

export function deleteEvent(scriptId: string, id: string): void {
  saveEvents(
    scriptId,
    loadEvents(scriptId).filter((e) => e.id !== id),
  );
}

// ── Colour mapping (per folder colour tag) ─────────────────────────────────

export interface ColorClasses {
  /** Filter chip + event block fill. */
  chip: string;
  /** Event block on the week grid. */
  block: string;
  /** Small colour dot. */
  dot: string;
}

const COLORS: Record<"blue" | "yellow" | "pink", ColorClasses> = {
  blue: {
    chip: "bg-blue-100 text-blue-700",
    block: "bg-blue-100 border-blue-300 text-blue-800",
    dot: "bg-blue-400",
  },
  yellow: {
    chip: "bg-amber-100 text-amber-800",
    block: "bg-amber-100 border-amber-300 text-amber-900",
    dot: "bg-amber-400",
  },
  pink: {
    chip: "bg-rose-100 text-rose-700",
    block: "bg-rose-100 border-rose-300 text-rose-800",
    dot: "bg-rose-400",
  },
};

export function colorFor(tag?: string): ColorClasses {
  return COLORS[tag as "blue" | "yellow" | "pink"] ?? COLORS.blue;
}

// Phase-based colour for calendar page event blocks.
const PHASE_COLORS: Record<PlanPhase, string> = {
  pre: "bg-[#FF9699] border-[#FF9699] text-gray-900",
  production: "bg-[#73B7FF] border-[#73B7FF] text-gray-900",
  post: "bg-[#FBBF24] border-[#FBBF24] text-gray-900",
};

export function phaseEventColor(ev: EnrichedCalendarEvent): string {
  if (ev.phase) return PHASE_COLORS[ev.phase];
  if (ev.colorTag === "pink") return PHASE_COLORS.pre;
  if (ev.colorTag === "yellow") return PHASE_COLORS.post;
  return PHASE_COLORS.production;
}

// ── Per-folder distinct colour ─────────────────────────────────────────────
// The 3-colour folder tag isn't enough to tell folders apart on the shared
// calendar (two "post-production" tasks from different folders looked identical).
// Hash each folder's id onto a wider fixed palette so every folder gets a
// stable, distinctive colour — collisions only past 10 folders.
const SCRIPT_PALETTE: ColorClasses[] = [
  {
    chip: "bg-blue-100 text-blue-700",
    block: "bg-blue-100 border-blue-300 text-blue-800",
    dot: "bg-blue-400",
  },
  {
    chip: "bg-amber-100 text-amber-800",
    block: "bg-amber-100 border-amber-300 text-amber-900",
    dot: "bg-amber-400",
  },
  {
    chip: "bg-rose-100 text-rose-700",
    block: "bg-rose-100 border-rose-300 text-rose-800",
    dot: "bg-rose-400",
  },
  {
    chip: "bg-emerald-100 text-emerald-700",
    block: "bg-emerald-100 border-emerald-300 text-emerald-800",
    dot: "bg-emerald-400",
  },
  {
    chip: "bg-violet-100 text-violet-700",
    block: "bg-violet-100 border-violet-300 text-violet-800",
    dot: "bg-violet-400",
  },
  {
    chip: "bg-cyan-100 text-cyan-700",
    block: "bg-cyan-100 border-cyan-300 text-cyan-800",
    dot: "bg-cyan-400",
  },
  {
    chip: "bg-orange-100 text-orange-700",
    block: "bg-orange-100 border-orange-300 text-orange-800",
    dot: "bg-orange-400",
  },
  {
    chip: "bg-fuchsia-100 text-fuchsia-700",
    block: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
    dot: "bg-fuchsia-400",
  },
  {
    chip: "bg-teal-100 text-teal-700",
    block: "bg-teal-100 border-teal-300 text-teal-800",
    dot: "bg-teal-400",
  },
  {
    chip: "bg-indigo-100 text-indigo-700",
    block: "bg-indigo-100 border-indigo-300 text-indigo-800",
    dot: "bg-indigo-400",
  },
];

// djb2 — stable hash so a folder keeps the same colour across reloads.
function hashStr(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h;
}

export function colorForScript(scriptId: string): ColorClasses {
  return SCRIPT_PALETTE[hashStr(scriptId) % SCRIPT_PALETTE.length];
}

// ── Aggregation (pure — unit-tested) ───────────────────────────────────────
