"use client";

import { Brain, Calendar, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface Props {
  currentStep: 1 | 2 | 3;
}

const steps = [
  { label: "MindMap Brainstorming", href: "/mind-map", icon: Brain },
  { label: "Summarise Your MindMap", href: "/summarise", icon: Sparkles },
  { label: "Plan Your Execution", href: "/plan", icon: Calendar },
];

const reminders = [
  {
    title: "Brainstorm with MindMap",
    desc: "Free flow charting anything you have in mind to create story",
  },
  {
    title: "Summarise Ideas",
    desc: "Turn your messy whiteboard into a clean, clustered table shortlist",
  },
  {
    title: "Arrange Your Post Schedule",
    desc: "Get your content ready to be published",
  },
];

export default function CreativeHelperSidebar({ currentStep }: Props) {
  return (
    <aside className="w-60 shrink-0 flex flex-col gap-4 p-5 bg-[var(--color-surface)] border-r border-gray-100 h-full overflow-y-auto">
      <h2 className="font-semibold text-gray-800 text-sm font-[var(--font-poppins)]">
        Your Creative Helper
      </h2>

      <div className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3;
          const isActive = stepNum === currentStep;
          const Icon = step.icon;
          return (
            <Link
              key={step.href}
              href={step.href}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all ${
                isActive
                  ? "bg-white shadow-sm font-semibold text-gray-800"
                  : "bg-gray-50 text-gray-500 hover:bg-white hover:shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  size={14}
                  className={
                    isActive ? "text-[var(--color-primary)]" : "text-gray-400"
                  }
                />
                <span>{step.label}</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </Link>
          );
        })}
      </div>

      <div className="mt-2 rounded-2xl border border-gray-100 p-4 bg-white">
        <h3 className="font-semibold text-gray-700 text-xs mb-3 font-[var(--font-poppins)]">
          Your Creative Flow Reminder
        </h3>
        <div className="flex flex-col gap-3">
          {reminders.map((r, i) => (
            <div key={r.title} className="flex gap-2.5">
              <span className="shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-700">{r.title}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
