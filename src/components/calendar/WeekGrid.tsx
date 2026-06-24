"use client";

import type { EnrichedCalendarEvent } from "@/types/plan";
import { colorForScript } from "@/utils/calendar";
import { DOW_SHORT, MONTHS, toISO, weekDays } from "./dateUtils";

interface Props {
  weekStart: Date;
  events: EnrichedCalendarEvent[];
  selectedISO: string;
  onSelectDay: (iso: string) => void;
  onDeleteEvent: (scriptId: string, id: string) => void;
}

// The week view — 7 day columns, each listing its events as colour-coded blocks.
export default function WeekGrid({
  weekStart,
  events,
  selectedISO,
  onSelectDay,
  onDeleteEvent,
}: Props) {
  const days = weekDays(weekStart);
  const todayISO = toISO(new Date());

  // Bucket events by ISO date for O(1) per-column lookup.
  const byDate = new Map<string, EnrichedCalendarEvent[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)?.push(e);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="mb-5 text-2xl font-bold text-gray-900">
        {MONTHS[weekStart.getMonth()]} {weekStart.getFullYear()}
      </h1>

      <div className="grid min-h-0 flex-1 grid-cols-7 gap-3">
        {days.map((d, i) => {
          const iso = toISO(d);
          const dayEvents = byDate.get(iso) ?? [];
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          return (
            <div key={iso} className="flex min-h-0 flex-col">
              <button
                type="button"
                onClick={() => onSelectDay(iso)}
                className="mb-2 text-center"
              >
                <span className="text-xs font-semibold text-gray-400">
                  {DOW_SHORT[i]}
                </span>{" "}
                <span
                  className={`text-xs font-semibold ${
                    isToday ? "text-orange-500" : "text-gray-700"
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>

              <div
                className={`flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto rounded-xl border p-1.5 ${
                  isSelected
                    ? "border-[var(--color-primary)] bg-indigo-50/30"
                    : "border-gray-100 bg-gray-50/40"
                }`}
              >
                {dayEvents.map((ev) => {
                  const c = colorForScript(ev.scriptId);
                  return (
                    <div
                      key={ev.id}
                      className={`group rounded-lg border px-2 py-1.5 text-[11px] ${c.block}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold leading-snug">
                          {ev.taskId ? "✓ " : ""}
                          {ev.title}
                        </span>
                        {/* Task-derived entries are read-only here (managed on
                            the plan board); only real events get a delete. */}
                        {!ev.taskId && (
                          <button
                            type="button"
                            onClick={() => onDeleteEvent(ev.scriptId, ev.id)}
                            aria-label="Delete event"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <span className="mt-0.5 block truncate opacity-70">
                        {ev.scriptTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
