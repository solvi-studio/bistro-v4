"use client";

import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { CalendarEvent, PlanTask } from "@/types/plan";
import { loadEvents } from "@/utils/calendar";
import { subscribeDataChange } from "@/utils/dataSync";
import { getPlanTasks, savePlanTasks } from "@/utils/plan";
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
  // The plan page is scoped to one folder (idea). Its calendar reads that
  // script's events from the shared per-script store (also feeds /calendar).
  const scriptId = params.get("script") ?? "default";

  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projectName, setProjectName] = useState("Your Idea");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(getPlanTasks(scriptId));
    setEvents(loadEvents(scriptId));
    setProjectName(getSummaryResult()?.meta.projectName ?? "Your Idea");
    setMounted(true);

    // Re-read when another view (the global calendar, etc.) writes events/tasks.
    const unsubscribe = subscribeDataChange(() => {
      setTasks(getPlanTasks(scriptId));
      setEvents(loadEvents(scriptId));
    });
    return unsubscribe;
  }, [scriptId]);

  function handleTasksUpdate(updated: PlanTask[]) {
    setTasks(updated);
    savePlanTasks(scriptId, updated);
  }

  // Project button → generate the task plan from the completed summary via the
  // backend. Only while the board is empty so repeated clicks don't clobber
  // edited tasks; the existing folder events are passed so the planner schedules
  // around real commitments. Generated tasks persist through the per-script
  // store (handleTasksUpdate → savePlanTasks), the single source of truth.
  async function generatePlan() {
    if (tasks.length > 0 || isGenerating) return;

    const summary = getSummaryResult();
    if (!summary) {
      setGenError("Summarise your idea first, then generate a plan.");
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    try {
      const generated = await generatePlanTasks({
        summary: buildPlanSummary(summary),
        schedule: buildScheduleText(events),
      });
      handleTasksUpdate(generated);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Failed to generate the plan.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDateSelect(date: string) {
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  const selectedEvent = selectedDate
    ? (events.find((e) => e.date === selectedDate) ?? null)
    : null;

  // Tasks scheduled on the selected day — surfaced in the detail card so the
  // dot on the calendar actually shows what's due.
  const selectedTasks = selectedDate
    ? tasks.filter((t) => t.scheduledDate === selectedDate)
    : [];

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
            Here&rsquo;s the list of what you need to prepare
          </h2>
        </div>

        <button
          type="button"
          onClick={generatePlan}
          disabled={tasks.length > 0 || isGenerating}
          title={
            tasks.length > 0
              ? "Plan already generated"
              : "Generate the task plan from your summary"
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-(--color-primary-hover) disabled:cursor-default disabled:opacity-60 disabled:hover:bg-primary"
        >
          <Sparkles
            size={14}
            className={isGenerating ? "animate-spin" : undefined}
          />
          {isGenerating ? "Generating…" : projectName}
        </button>

        {genError && <p className="mt-2 text-xs text-red-500">{genError}</p>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4 px-8 pb-8 overflow-hidden">
        {/* Phase board: Pre / Production / Post columns */}
        <div className="flex-1 min-h-0">
          <PlanBoard tasks={tasks} onUpdate={handleTasksUpdate} />
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
