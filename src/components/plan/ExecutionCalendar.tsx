"use client";

import type { CalendarView } from "@/types/plan";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  markedDates: string[];
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
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

function toISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const sm = MONTHS_SHORT[start.getMonth()];
  const em = MONTHS_SHORT[end.getMonth()];
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${sm} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${sm} ${start.getDate()} – ${em} ${end.getDate()}, ${end.getFullYear()}`;
}

export default function ExecutionCalendar({
  markedDates,
  selectedDate,
  onSelectDate,
}: Props) {
  const today = new Date();

  const [view, setView] = useState<CalendarView>("monthly");

  // Monthly cursor: year + month
  const [monthCursor, setMonthCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  // Weekly cursor: start-of-week Date, independent of selected date
  const [weekCursor, setWeekCursor] = useState<Date>(() => startOfWeek(today));

  const eventDates = new Set(markedDates);

  const todayISO = toISO(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  // Monthly grid
  const firstDay = new Date(monthCursor.year, monthCursor.month, 1).getDay();
  const daysInMonth = new Date(
    monthCursor.year,
    monthCursor.month + 1,
    0,
  ).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Weekly grid — always 7 days from weekCursor
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekCursor);
    d.setDate(weekCursor.getDate() + i);
    return d;
  });

  function prevMonth() {
    setMonthCursor((c) => {
      if (c.month === 0) return { year: c.year - 1, month: 11 };
      return { ...c, month: c.month - 1 };
    });
  }

  function nextMonth() {
    setMonthCursor((c) => {
      if (c.month === 11) return { year: c.year + 1, month: 0 };
      return { ...c, month: c.month + 1 };
    });
  }

  function prevWeek() {
    setWeekCursor((c) => {
      const d = new Date(c);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setWeekCursor((c) => {
      const d = new Date(c);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  // When switching to weekly view, jump weekCursor to the selected date's week
  function handleViewChange(v: CalendarView) {
    if (v === "weekly" && selectedDate) {
      setWeekCursor(startOfWeek(new Date(selectedDate + "T00:00:00")));
    }
    setView(v);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex items-center justify-between gap-2">
        {/* View toggle */}
        <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-full shrink-0">
          {(["monthly", "weekly"] as CalendarView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleViewChange(v)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                view === v
                  ? "bg-white shadow-sm text-gray-800"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {v === "monthly" ? "Monthly" : "Weekly"}
            </button>
          ))}
        </div>

        {/* Navigation — month or week depending on view */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={view === "monthly" ? prevMonth : prevWeek}
            aria-label={view === "monthly" ? "Previous month" : "Previous week"}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={14} className="text-gray-500" />
          </button>

          <span className="text-xs font-semibold text-gray-700 min-w-27.5 text-center tabular-nums">
            {view === "monthly"
              ? `${MONTHS[monthCursor.month]} ${monthCursor.year}`
              : formatWeekRange(weekCursor)}
          </span>

          <button
            type="button"
            onClick={view === "monthly" ? nextMonth : nextWeek}
            aria-label={view === "monthly" ? "Next month" : "Next week"}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
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

      {/* Monthly grid */}
      {view === "monthly" ? (
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={`empty-${i}`} />;
            const iso = toISO(monthCursor.year, monthCursor.month, day);
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
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Weekly grid — fixed height, never jumps */
        <div className="grid grid-cols-7 gap-1">
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
                className={`relative flex flex-col items-center justify-center h-16 rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-[10px] opacity-60 mb-0.5">
                  {MONTHS_SHORT[d.getMonth()]}
                </span>
                <span>{d.getDate()}</span>
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
