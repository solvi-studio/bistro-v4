"use client";

import { useEffect, useMemo, useState } from "react";
import type { CreativeScript } from "@/types/creative";
import type { EnrichedCalendarEvent } from "@/types/plan";
import { addEvent, deleteEvent, getAllEvents } from "@/utils/calendar";
import { getScripts } from "@/utils/creative";
import { subscribeDataChange } from "@/utils/dataSync";
import CalendarSidebar from "./CalendarSidebar";
import CreateEventModal from "./CreateEventModal";
import { fromISO, startOfWeek, toISO } from "./dateUtils";
import WeekGrid from "./WeekGrid";

export default function CalendarPageClient() {
  const [scripts, setScripts] = useState<CreativeScript[]>([]);
  const [events, setEvents] = useState<EnrichedCalendarEvent[]>([]);
  const [activeScriptIds, setActiveScriptIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedISO, setSelectedISO] = useState(() => toISO(new Date()));
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load folders + aggregated events after mount (storage is client-only), and
  // re-read whenever another view (plan board, etc.) writes.
  useEffect(() => {
    const s = getScripts();
    setScripts(s);
    setActiveScriptIds(new Set(s.map((x) => x.id)));
    setEvents(getAllEvents());
    setMounted(true);

    const unsubscribe = subscribeDataChange(() => {
      const next = getScripts();
      setScripts(next);
      // Keep existing filter choices; default-show any newly added folder.
      setActiveScriptIds((prev) => {
        const ids = new Set(prev);
        for (const x of next) if (!ids.has(x.id)) ids.add(x.id);
        return ids;
      });
      setEvents(getAllEvents());
    });
    return unsubscribe;
  }, []);

  function refresh() {
    setEvents(getAllEvents());
  }

  function toggleScript(id: string) {
    setActiveScriptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  function handleDelete(scriptId: string, id: string) {
    deleteEvent(scriptId, id);
    refresh();
  }

  const weekStart = useMemo(
    () => startOfWeek(fromISO(selectedISO)),
    [selectedISO],
  );

  const visibleEvents = useMemo(
    () => events.filter((e) => activeScriptIds.has(e.scriptId)),
    [events, activeScriptIds],
  );

  if (!mounted) {
    return <div className="h-full" style={{ background: "#FAFAFB" }} />;
  }

  return (
    <div
      className="flex h-full font-[var(--font-poppins)]"
      style={{ background: "#FAFAFB" }}
    >
      <CalendarSidebar
        scripts={scripts}
        activeScriptIds={activeScriptIds}
        onToggleScript={toggleScript}
        selectedISO={selectedISO}
        onSelectDate={setSelectedISO}
        onCreate={() => setCreating(true)}
      />

      <main className="min-w-0 flex-1 p-4">
        <WeekGrid
          weekStart={weekStart}
          events={visibleEvents}
          selectedISO={selectedISO}
          onSelectDay={setSelectedISO}
          onDeleteEvent={handleDelete}
        />
      </main>

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
