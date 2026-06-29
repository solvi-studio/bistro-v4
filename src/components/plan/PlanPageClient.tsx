"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getPlanTasks as dbGetPlanTasks,
  savePlanTasks as dbSavePlanTasks,
} from "@/lib/db/actions/plan";
import type { CalendarEvent, PlanTask } from "@/types/plan";
import { loadEvents } from "@/utils/calendar";
import { subscribeDataChange } from "@/utils/dataSync";
import {
  buildPlanSummary,
  buildScheduleText,
  generatePlanTasks,
} from "@/utils/plan-service";
import { getSummaryResult } from "@/utils/summarise-service";
import DayScheduleCard from "./DayScheduleCard";
import ExecutionCalendar from "./ExecutionCalendar";
import PlanBoard from "./PlanBoard";

export default function PlanPageClient() {
  const params = useSearchParams();
  const scriptId = params.get("script") ?? "default";

  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projectName, setProjectName] = useState("Your Idea");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const currentEvents = loadEvents(scriptId);
    setEvents(currentEvents);

    dbGetPlanTasks(scriptId)
      .then(async (loaded) => {
        if (cancelled) return;
        setTasks(loaded);
        setMounted(true);

        // Auto-generate plan when board is empty and a summary exists.
        if (loaded.length === 0) {
          const summary = await getSummaryResult(scriptId);
          if (cancelled || !summary) return;

          setIsGenerating(true);
          try {
            const generated = await generatePlanTasks({
              summary: buildPlanSummary(summary),
              schedule: buildScheduleText(currentEvents),
            });
            if (cancelled) return;
            setTasks(generated);
            dbSavePlanTasks(scriptId, generated).catch(console.error);
          } catch (err) {
            if (!cancelled) {
              setGenError(
                err instanceof Error
                  ? err.message
                  : "Failed to generate the plan.",
              );
            }
          } finally {
            if (!cancelled) setIsGenerating(false);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load plan tasks:", err);
        if (!cancelled) setMounted(true);
      });

    getSummaryResult(scriptId)
      .then((r) => setProjectName(r?.meta.projectName ?? "Your Idea"))
      .catch(console.error);

    const unsubscribe = subscribeDataChange(() => {
      setEvents(loadEvents(scriptId));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [scriptId]);

  function handleTasksUpdate(updated: PlanTask[]) {
    setTasks(updated);
    dbSavePlanTasks(scriptId, updated).catch(console.error);
  }

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const selectedEvent = selectedDate
    ? (events.find((e) => e.date === selectedDate) ?? null)
    : null;

  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.scheduledDate === selectedDate)
    : [];

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
      className="flex flex-col h-full font-(--font-poppins) overflow-hidden"
      style={{ background: "#FAFAFB" }}
    >
      {/* Header */}
      <div className="px-8 pt-7 pb-4 shrink-0">
        <div className="flex flex-row items-start gap-5">
          <h1 className="text-2xl font-(--font-display) text-gray-800">
            Plan your idea
          </h1>
          <h2 className="mt-3 text-sm text-gray-500">
            {isGenerating
              ? "Generating your plan…"
              : projectName !== "Your Idea"
                ? projectName
                : "Here’s the list of what you need to prepare"}
          </h2>
        </div>
        {genError && <p className="mt-2 text-xs text-red-500">{genError}</p>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 px-8 pb-8 overflow-hidden">
        {/* Phase board */}
        <div className="flex-1 min-h-0">
          <PlanBoard
            tasks={tasks}
            onUpdate={handleTasksUpdate}
            isLoading={isGenerating}
          />
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
            <DayScheduleCard
              event={selectedEvent}
              tasks={selectedTasks}
              date={selectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
