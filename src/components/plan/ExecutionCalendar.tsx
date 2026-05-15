"use client";

import type { CalendarEvent, CalendarView } from "@/types/plan";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  events: CalendarEvent[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ExecutionCalendar({
  events,
  selectedDate,
  onSelectDate,
}: Props) {
  const today = new Date();
  const [view, setView] = useState<CalendarView>("monthly");
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const eventDates = new Set(events.map((e) => e.date));

  function prevMonth() {
    setCursor((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { ...c, month: c.month - 1 };
    });
  }

  function nextMonth() {
    setCursor((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { ...c, month: c.month + 1 };
    });
  }

  const firstDay = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayISO = toISO(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Weekly: 7 days around today or selected date
  const weekBase = selectedDate ? new Date(selectedDate + "T00:00:00") : today;
  const weekStart = new Date(weekBase);
  weekStart.setDate(weekBase.getDate() - weekBase.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* View toggle + nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-full">
          {(["monthly", "weekly"] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors capitalize ${
                view === v
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {v === "monthly" ? "Monthly View" : "Weekly View"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous"
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <span className="text-xs font-semibold text-gray-700">
            {MONTHS[cursor.month]} {cursor.year}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next"
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {view === "monthly" ? (
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const iso = toISO(cursor.year, cursor.month, day);
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;
            const hasEvent = eventDates.has(iso);

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={`relative flex flex-col items-center justify-center h-8 w-full rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--color-primary)] text-white"
                    : isToday
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map((d) => {
            const iso = toISO(d.getFullYear(), d.getMonth(), d.getDate());
            const isToday = iso === todayISO;
            const isSelected = iso === selectedDate;
            const hasEvent = eventDates.has(iso);

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onSelectDate(iso)}
                className={`relative flex flex-col items-center justify-center h-10 rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[var(--color-primary)] text-white"
                    : isToday
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {d.getDate()}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
