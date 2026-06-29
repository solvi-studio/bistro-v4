"use client";

import { Plus } from "lucide-react";
import type { PlanPhase, PlanTask } from "@/types/plan";
import TaskItem from "./TaskItem";

interface Props {
  tasks: PlanTask[];
  onUpdate: (tasks: PlanTask[]) => void;
  isLoading?: boolean;
}

interface PhaseConfig {
  key: PlanPhase;
  label: string;
  colorTag: PlanTask["colorTag"];
  column: string; // tinted column background
  pill: string; // header pill
  accent: string; // card text colour
  add: string; // "Add New Task" button
}

const PHASES: PhaseConfig[] = [
  {
    key: "pre",
    label: "Pre-Production",
    colorTag: "pink",
    column: "bg-rose-50",
    pill: "bg-rose-200 text-rose-800",
    accent: "text-rose-700",
    add: "text-rose-600 border-rose-200 hover:bg-rose-100/60",
  },
  {
    key: "production",
    label: "Production Day",
    colorTag: "blue",
    column: "bg-blue-50",
    pill: "bg-blue-200 text-blue-800",
    accent: "text-blue-700",
    add: "text-blue-600 border-blue-200 hover:bg-blue-100/60",
  },
  {
    key: "post",
    label: "Post-Production",
    colorTag: "yellow",
    column: "bg-amber-50",
    pill: "bg-amber-200 text-amber-900",
    accent: "text-amber-700",
    add: "text-amber-600 border-amber-200 hover:bg-amber-100/60",
  },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl bg-white/60 px-3 py-2.5">
      <div className="mb-1.5 h-3 w-3/4 rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-100" />
    </div>
  );
}

export default function PlanBoard({
  tasks,
  onUpdate,
  isLoading = false,
}: Props) {
  function updateTask(updated: PlanTask) {
    onUpdate(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  function deleteTask(id: string) {
    onUpdate(tasks.filter((t) => t.id !== id));
  }

  function addTask(phase: PhaseConfig) {
    const task: PlanTask = {
      id: Date.now().toString(),
      text: "New task",
      completed: false,
      colorTag: phase.colorTag,
      phase: phase.key,
    };
    onUpdate([...tasks, task]);
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3">
      {PHASES.map((phase) => {
        const items = tasks.filter((t) => t.phase === phase.key);
        return (
          <div
            key={phase.key}
            className={`flex min-h-0 flex-col rounded-2xl p-4 ${phase.column}`}
          >
            <span
              className={`mb-3 inline-flex w-fit shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${phase.pill}`}
            >
              {phase.label}
            </span>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
              {isLoading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  {items.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                      variant="card"
                      accentCls={phase.accent}
                    />
                  ))}

                  <button
                    type="button"
                    onClick={() => addTask(phase)}
                    className={`flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed bg-white/40 py-2.5 text-[13px] font-medium transition-colors ${phase.add}`}
                  >
                    <Plus size={14} />
                    Add New Task
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
