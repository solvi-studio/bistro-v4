"use client";

import { useEffect, useRef } from "react";
import type { EnrichedCalendarEvent } from "@/types/plan";
import { phaseEventColor } from "@/utils/calendar";
import { DOW_SHORT, fmtHour, timeToMins, toISO } from "./dateUtils";

const HOUR_HEIGHT = 64;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface Props {
  days: Date[];
  events: EnrichedCalendarEvent[];
  selectedISO: string;
  onSelectDay: (iso: string) => void;
  onSelectEvent: (ev: EnrichedCalendarEvent) => void;
}

export default function TimeGrid({
  days,
  events,
  selectedISO,
  onSelectDay,
  onSelectEvent,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayISO = toISO(new Date());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 7 * HOUR_HEIGHT;
    }
  }, []);

  const byDate = new Map<string, EnrichedCalendarEvent[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const colCount = days.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Sticky day headers */}
      <div
        className="flex shrink-0 border-b border-gray-100 bg-white"
        style={{ paddingLeft: 56 }}
      >
        {days.map((d) => {
          const iso = toISO(d);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedISO;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDay(iso)}
              className={`flex flex-1 flex-col items-center py-2.5 transition-colors hover:bg-gray-50 ${
                isSelected ? "bg-indigo-50/60" : ""
              }`}
            >
              <span className="text-[11px] font-semibold text-gray-400">
                {DOW_SHORT[d.getDay()].toUpperCase()}
              </span>
              <span
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : "text-gray-800"
                }`}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="flex"
          style={{ height: 24 * HOUR_HEIGHT, minWidth: 0 }}
        >
          {/* Hours column */}
          <div className="relative w-14 shrink-0">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute right-0 flex w-14 justify-end pr-2"
                style={{ top: h * HOUR_HEIGHT - 8 }}
              >
                {h > 0 && (
                  <span className="select-none text-[10px] text-gray-400">
                    {fmtHour(h)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const iso = toISO(d);
            const dayEvents = byDate.get(iso) ?? [];
            const timed = dayEvents.filter((e) => e.time);
            const allDay = dayEvents.filter((e) => !e.time);

            return (
              <div
                key={iso}
                className="relative flex-1 border-l border-gray-100"
                style={{ minWidth: 0 }}
              >
                {/* Hour lines */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: h * HOUR_HEIGHT }}
                  />
                ))}

                {/* All-day / untimed events stacked at top */}
                {allDay.map((ev, idx) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => onSelectEvent(ev)}
                    className={`absolute left-1 right-1 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded border px-1.5 py-1 text-center text-[11px] transition-brightness hover:brightness-95 ${phaseEventColor(ev)}`}
                    style={{ top: 4 + idx * 26 }}
                  >
                    <div className="w-full truncate text-center font-semibold">
                      [{ev.scriptTitle}]
                    </div>
                    <div className="w-full truncate text-center">{ev.title}</div>
                  </button>
                ))}

                {/* Timed events */}
                {timed.map((ev) => {
                  const startMins = timeToMins(ev.time!);
                  const endMins = ev.endTime
                    ? timeToMins(ev.endTime)
                    : startMins + 60;
                  const top = (startMins / 60) * HOUR_HEIGHT;
                  const height = Math.max(
                    ((endMins - startMins) / 60) * HOUR_HEIGHT,
                    28,
                  );
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev)}
                      className={`absolute left-1 right-1 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded border px-1.5 py-1 text-center text-[11px] transition-brightness hover:brightness-95 ${phaseEventColor(ev)}`}
                      style={{ top, height }}
                    >
                      <div className="w-full truncate text-center font-semibold">
                        [{ev.scriptTitle}]
                      </div>
                      {height > 36 && (
                        <div className="w-full truncate text-center">{ev.title}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
