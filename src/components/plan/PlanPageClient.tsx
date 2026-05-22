"use client";

import { useEffect, useState } from "react";
import type { CalendarEvent, PlanTask } from "@/types/plan";
import { getCalendarEvents, getPlanTasks, savePlanTasks } from "@/utils/plan";
import EventDetailCard from "./EventDetailCard";
import ExecutionCalendar from "./ExecutionCalendar";
import TaskList from "./TaskList";

export default function PlanPageClient() {
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTasks(getPlanTasks());
    setEvents(getCalendarEvents());
    setMounted(true);
  }, []);

  function handleTasksUpdate(updated: PlanTask[]) {
    setTasks(updated);
    savePlanTasks(updated);
  }

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const selectedEvent = selectedDate
    ? (events.find((e) => e.date === selectedDate) ?? null)
    : null;

  // Derive calendar markers from both stored events and task scheduled dates
  const markedDates = [
    ...events.map((e) => e.date),
    ...tasks.flatMap((t) => (t.scheduledDate ? [t.scheduledDate] : [])),
  ];

  if (!mounted) {
    return (
      <div className="flex h-full" style={{ background: "#FAFAFB" }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-shimmer h-8 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full font-[var(--font-poppins)] overflow-hidden"
      style={{ background: "#FAFAFB" }}
    >
      {/* Header */}
      <div className="px-8 pt-7 pb-4 shrink-0">
        <h1 className="text-2xl font-[var(--font-display)] text-gray-800">
          Plan your idea
        </h1>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 px-8 pb-8 overflow-hidden">
        {/* Task list card */}
        <div className="flex-1 min-h-0 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-6">
            <TaskList tasks={tasks} onUpdate={handleTasksUpdate} />
          </div>
        </div>

        {/* Calendar card */}
        <div className="shrink-0 rounded-2xl bg-white shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Execution Calendar
          </h3>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <ExecutionCalendar
                markedDates={markedDates}
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
              />
            </div>
            <EventDetailCard event={selectedEvent} date={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
