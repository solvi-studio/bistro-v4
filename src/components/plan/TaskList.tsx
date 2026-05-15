"use client";

import type { PlanTask } from "@/types/plan";
import { Plus } from "lucide-react";
import { useRef } from "react";
import { flushSync } from "react-dom";
import TaskItem from "./TaskItem";

interface Props {
  tasks: PlanTask[];
  onUpdate: (tasks: PlanTask[]) => void;
}

const COLORS: PlanTask["colorTag"][] = ["pink", "blue", "yellow", "default"];

export default function TaskList({ tasks, onUpdate }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  function handleUpdateTask(updated: PlanTask) {
    onUpdate(tasks.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleAdd() {
    const newTask: PlanTask = {
      id: Date.now().toString(),
      text: "New task",
      completed: false,
      colorTag: COLORS[tasks.length % COLORS.length],
    };
    // flushSync forces DOM update synchronously so scrollTo sees the new item
    flushSync(() => {
      onUpdate([...tasks, newTask]);
    });
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h2
            className="text-gray-800 text-base"
            style={{
              fontFamily: "var(--font-poppins), Poppins, sans-serif",
              fontWeight: 600,
            }}
          >
            Plan your idea
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Here&rsquo;s the list of what you need to prepare
          </p>
        </div>
        <button
          type="button"
          aria-label="Add task"
          onClick={handleAdd}
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
        <div
          ref={listRef}
          className="flex flex-col gap-1 overflow-y-auto flex-1 pr-3"
        >
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} />
          ))}
        </div>
      )}
    </div>
  );
}
