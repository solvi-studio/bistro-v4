"use client";

import type { PlanTask } from "@/types/plan";
import { Plus } from "lucide-react";
import TaskItem from "./TaskItem";

interface Props {
  tasks: PlanTask[];
  onUpdate: (tasks: PlanTask[]) => void;
}

export default function TaskList({ tasks, onUpdate }: Props) {
  function handleUpdateTask(updated: PlanTask) {
    onUpdate(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-semibold text-gray-800 text-base font-[var(--font-poppins)]">
            Plan your idea
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Here&rsquo;s the list of what you need to prepare
          </p>
        </div>
        <button
          type="button"
          aria-label="Add task"
          onClick={() => {
            const colors: PlanTask["colorTag"][] = [
              "pink",
              "blue",
              "yellow",
              "default",
            ];
            const newTask: PlanTask = {
              id: Date.now().toString(),
              text: "New task",
              completed: false,
              colorTag: colors[tasks.length % colors.length],
            };
            onUpdate([...tasks, newTask]);
          }}
          className="p-1.5 rounded-full bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No tasks yet — tap + to add one
        </div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} />
          ))}
        </div>
      )}
    </div>
  );
}
