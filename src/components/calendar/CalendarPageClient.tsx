"use client";

import { ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CreativeScript } from "@/types/creative";
import type {
  CalendarPageView,
  EnrichedCalendarEvent,
  PlanPhase,
} from "@/types/plan";
import { addEvent, deleteEvent, getAllEvents } from "@/utils/calendar";
import { getScripts } from "@/utils/creative";
import { subscribeDataChange } from "@/utils/dataSync";
import CalendarSidebar from "./CalendarSidebar";
import CreateEventModal from "./CreateEventModal";
import EventDetailPanel from "./EventDetailPanel";
import MonthGrid from "./MonthGrid";
import TimeGrid from "./TimeGrid";
import {
  MONTHS,
  addDays,
  fromISO,
  nDays,
  startOfWeek,
  toISO,
} from "./dateUtils";

const VIEW_LABELS: Record<CalendarPageView, string> = {
  day: "Day",
  "3day": "3 Days",
  week: "Week",
  month: "Month",
};

const VIEWS: CalendarPageView[] = ["day", "3day", "week", "month"];

export default function CalendarPageClient() {
  const [scripts, setScripts] = useState<CreativeScript[]>([]);
  const [events, setEvents] = useState<EnrichedCalendarEvent[]>([]);
  const [activePhases, setActivePhases] = useState<Set<PlanPhase>>(
    new Set<PlanPhase>(["pre", "production", "post"]),
  );
  const [selectedISO, setSelectedISO] = useState(() => toISO(new Date()));
  const [view, setView] = useState<CalendarPageView>("week");
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedEvent, setSelectedEvent] =
    useState<EnrichedCalendarEvent | null>(null);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getScripts();
    setScripts(s);
    setEvents(getAllEvents());
    setMounted(true);

    const unsub = subscribeDataChange(() => {
      setScripts(getScripts());
      setEvents(getAllEvents());
    });
    return unsub;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setViewDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function refresh() {
    setEvents(getAllEvents());
  }

  function togglePhase(p: PlanPhase) {
    setActivePhases((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function handleCreate(
    scriptId: string,
    input: { date: string; title: string; notes: string[] },
  ) {
    addEvent(scriptId, input);
    refresh();
  }

  // Days shown for time-grid views
  const viewDays = useMemo(() => {
    const base = fromISO(selectedISO);
    if (view === "day") return [base];
    if (view === "3day") return nDays(base, 3);
    if (view === "week") return nDays(startOfWeek(base), 7);
    return [];
  }, [selectedISO, view]);

  // Header title
  const headerTitle = useMemo(() => {
    const d = fromISO(selectedISO);
    if (view === "month" || viewDays.length === 0) {
      return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    }
    const first = viewDays[0];
    const last = viewDays[viewDays.length - 1];
    if (first.getMonth() === last.getMonth()) {
      return `${MONTHS[first.getMonth()]} ${first.getFullYear()}`;
    }
    return `${MONTHS[first.getMonth()]} – ${MONTHS[last.getMonth()]} ${last.getFullYear()}`;
  }, [selectedISO, view, viewDays]);

  function navigate(dir: 1 | -1) {
    const d = fromISO(selectedISO);
    let next: Date;
    if (view === "day") next = addDays(d, dir);
    else if (view === "3day") next = addDays(d, 3 * dir);
    else if (view === "week") next = addDays(d, 7 * dir);
    else next = new Date(d.getFullYear(), d.getMonth() + dir, 1);
    setSelectedISO(toISO(next));
  }

  const visibleEvents = useMemo(
    () =>
      events.filter((e) => {
        if (e.phase) return activePhases.has(e.phase);
        return true; // non-task events always visible
      }),
    [events, activePhases],
  );

  if (!mounted) {
    return <div className="h-full" style={{ background: "#FAFAFB" }} />;
  }

  const sel = fromISO(selectedISO);
  const monthView = { year: sel.getFullYear(), month: sel.getMonth() };

  return (
    <div
      className="flex h-full font-(--font-poppins) font-medium"
      style={{ background: "#FAFAFB" }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <CalendarSidebar
          activePhases={activePhases}
          onTogglePhase={togglePhase}
          selectedISO={selectedISO}
          onSelectDate={setSelectedISO}
          onCreate={() => setCreating(true)}
          onCollapse={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        {/* Header bar */}
        <div className="flex items-center gap-2">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Expand sidebar"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-gray-200"
            >
              <ChevronsRight size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Previous"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-200"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate(1)}
            aria-label="Next"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-500 hover:bg-gray-200"
          >
            <ChevronRight size={16} />
          </button>

          <h1 className="flex-1 text-2xl font-bold text-gray-900">
            {headerTitle}
          </h1>

          {/* View selector */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setViewDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
            >
              {VIEW_LABELS[view]}
              <span className="opacity-60">▾</span>
            </button>
            {viewDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                {VIEWS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setView(v);
                      setViewDropdownOpen(false);
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                      view === v
                        ? "font-semibold text-primary"
                        : "text-gray-700"
                    }`}
                  >
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedISO(toISO(new Date()))}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover)"
          >
            Today
          </button>
        </div>

        {/* Calendar body */}
        {view === "month" ? (
          <MonthGrid
            {...monthView}
            events={visibleEvents}
            selectedISO={selectedISO}
            onSelectDay={setSelectedISO}
            onSelectEvent={setSelectedEvent}
          />
        ) : (
          <TimeGrid
            days={viewDays}
            events={visibleEvents}
            selectedISO={selectedISO}
            onSelectDay={setSelectedISO}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </main>

      {/* Event detail panel */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {creating && (
        <CreateEventModal
          scripts={scripts}
          defaultDate={selectedISO}
          onClose={() => setCreating(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
