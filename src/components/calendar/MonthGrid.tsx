"use client";

import type { EnrichedCalendarEvent } from "@/types/plan";
import { phaseEventColor } from "@/utils/calendar";
import { DOW_SHORT, MONTHS, monthCells, toISO } from "./dateUtils";

const MAX_VISIBLE = 3;

interface Props {
  year: number;
  month: number;
  events: EnrichedCalendarEvent[];
  selectedISO: string;
  onSelectDay: (iso: string) => void;
  onSelectEvent: (ev: EnrichedCalendarEvent) => void;
}

export default function MonthGrid({
  year,
  month,
  events,
  selectedISO,
  onSelectDay,
  onSelectEvent,
}: Props) {
  const todayISO = toISO(new Date());
  const cells = monthCells(year, month);

  const byDate = new Map<string, EnrichedCalendarEvent[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm p-4">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_SHORT.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-semibold text-gray-400"
          >
            {d.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-gray-100">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} className="bg-white" />;
          }
          const iso = toISO(new Date(year, month, day));
          const dayEvents = byDate.get(iso) ?? [];
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          const overflow = dayEvents.length - MAX_VISIBLE;

          return (
            <div
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={`min-h-20 cursor-pointer bg-white p-1.5 transition-colors hover:bg-gray-50 ${
                isSelected ? "ring-2 ring-inset ring-indigo-400" : ""
              }`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : "text-gray-700"
                }`}
              >
                {day}
              </div>

              {dayEvents.slice(0, MAX_VISIBLE).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEvent(ev);
                  }}
                  className={`mb-0.5 w-full truncate rounded border px-1 py-0.5 text-center text-[10px] font-medium ${phaseEventColor(ev)}`}
                >
                  [{ev.scriptTitle}] {ev.title}
                </button>
              ))}

              {overflow > 0 && (
                <div className="text-[10px] text-gray-400 pl-1">
                  +{overflow} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
