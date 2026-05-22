"use client";

import {
  Brain,
  ChevronsLeft,
  ListChecks,
  Maximize2,
  Workflow,
} from "lucide-react";

interface Slide {
  title: string;
  icon: typeof Brain;
  panelBg: string;
  body1: string;
  body2: string;
}

const SLIDES: Slide[] = [
  {
    title: "MindMap Brainstorming",
    icon: Brain,
    panelBg: "#f9dee0",
    body1:
      "This is the tool to help you spark your own ideas. Solvi will ask you some questions to guide your creative direction.",
    body2:
      "From there, you can map out those tiny bits altogether in one place with our Mindmap tool, designed to elevate your ideas to the next level.",
  },
  {
    title: "Summarise Your MindMap",
    icon: ListChecks,
    panelBg: "#e4ebf9",
    body1:
      "This is the tool to help you summarise your messy, but powerful mindmap into a single column.",
    body2:
      "Solvi will then map out key information from your brainstorming mindmap onto a condensed table that is available for you to shoot your shots any time you need to refer back to.",
  },
  {
    title: "Plan Your Execution",
    icon: Workflow,
    panelBg: "#f8edcb",
    body1:
      "This is the tool to help you plan your to-do list to make your content go live. Solvi helps you break down your idea into tasks for execution.",
    body2:
      "Also, let your brain go rent-free — you wouldn't need to worry what's on your plate as Solvi will remind you on the day.",
  },
];

// ─── Mockups ──────────────────────────────────────────────────────────────

function MiniMindMap() {
  return (
    <div
      className="rounded-xl bg-white p-4"
      style={{
        backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)",
        backgroundSize: "14px 14px",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-2xl rounded-bl-sm bg-[#f0a9ab] px-3 py-2 text-xs font-bold text-white">
          OOTD
        </span>
        <span className="text-gray-400">→</span>
        <span className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
          Clothing
        </span>
      </div>
      <div className="ml-16 mt-2 flex gap-2">
        <span className="rounded-lg bg-[#dde6f6] px-2.5 py-1 text-[11px] font-medium text-gray-700">
          Ons shoes
        </span>
        <span className="rounded-lg bg-[#dde6f6] px-2.5 py-1 text-[11px] font-medium text-gray-700">
          Gymshark
        </span>
      </div>
    </div>
  );
}

function ChatMock() {
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="flex gap-2">
        <span className="h-6 w-6 shrink-0 rounded-full bg-[#8bb89a]" />
        <span className="rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 text-[11px] text-gray-600">
          What's your overarching theme for this story?
        </span>
      </div>
      <div className="mt-2 flex justify-end">
        <span className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dde6f6] px-3 py-2 text-[11px] text-gray-700">
          Showing my OOTD when hustling to go network with other runners to
          prepare for Nike Half marathon competition…
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-300" />
      </div>
    </div>
  );
}

function MiniTable() {
  const cols = ["Storyboard", "Script", "Description", "Camera Angle"];
  return (
    <div className="rounded-xl bg-white p-4">
      <div className="grid grid-cols-4 gap-2">
        {cols.map((c) => (
          <p key={c} className="text-[10px] font-bold text-gray-700">
            {c}
          </p>
        ))}
        <span className="h-10 rounded bg-gray-100" />
        {[0, 1, 2].map((i) => (
          <div key={`cell-${i}`} className="flex flex-col gap-1">
            <span className="h-1.5 rounded bg-gray-200" />
            <span className="h-1.5 w-4/5 rounded bg-gray-200" />
            <span className="h-1.5 w-3/5 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <span className="rounded-full bg-[var(--color-primary)] px-4 py-1 text-[10px] font-semibold text-white">
          Confirm
        </span>
      </div>
    </div>
  );
}

function MiniTaskList() {
  const tasks = [
    { label: "Go to Blue Mountains", color: "#f6d3d4" },
    { label: "Bring your digi cam and camping equipment", color: "#f6d3d4" },
    { label: "Film stargazing sequences", color: "#dde6f6" },
    { label: "Edit your film and colour grade", color: "#f8e7af" },
  ];
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-white p-4">
      {tasks.map((t) => (
        <div key={t.label} className="flex items-center gap-2">
          <span
            className="flex-1 rounded-lg px-3 py-1.5 text-[10px] font-medium text-gray-700"
            style={{ backgroundColor: t.color }}
          >
            {t.label}
          </span>
          <span className="h-4 w-4 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function MiniCalendar() {
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return (
    <div className="flex gap-3 rounded-xl bg-white p-4">
      <div className="flex flex-1 gap-1 rounded-lg bg-[#2b2b2e] p-2">
        {days.map((d, i) => (
          <div key={d} className="flex-1 text-center">
            <p className="text-[7px] font-semibold text-gray-400">{d}</p>
            <p className="mt-0.5 text-[9px] font-bold text-white">{i + 1}</p>
          </div>
        ))}
      </div>
      <div className="w-24 rounded-lg bg-[#dde6f6] p-2">
        <p className="text-[9px] font-bold text-gray-700">Reminder</p>
        <p className="mt-1 text-[8px] leading-tight text-gray-500">
          Today's the day for editing your Blue Mountains content
        </p>
      </div>
    </div>
  );
}

function SlideMockups({ index }: { index: number }) {
  if (index === 0) {
    return (
      <>
        <ChatMock />
        <MiniMindMap />
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <MiniMindMap />
        <MiniTable />
      </>
    );
  }
  return (
    <>
      <MiniTaskList />
      <MiniCalendar />
    </>
  );
}

// ─── Panel ──────────────────────────────────────────────────────────────────

interface Props {
  active: number;
  onToggleCollapse: () => void;
}

export default function InstructionPanel({ active, onToggleCollapse }: Props) {
  const slide = SLIDES[active];
  const Icon = slide.icon;

  return (
    <section className="flex flex-1 flex-col">
      <header className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Collapse helper"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <ChevronsLeft size={18} />
        </button>
        <h2 className="flex-1 text-lg font-bold text-gray-800">Instruction</h2>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="Expand panel"
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <Maximize2 size={15} />
        </button>
      </header>

      <div
        className="flex flex-col gap-4 rounded-2xl p-6"
        style={{ backgroundColor: slide.panelBg }}
      >
        <div className="flex items-center gap-2">
          <Icon size={20} className="text-gray-800" strokeWidth={2.2} />
          <h3 className="text-base font-bold text-gray-800">{slide.title}</h3>
        </div>
        <p className="text-xs leading-relaxed text-gray-600">{slide.body1}</p>
        <SlideMockups index={active} />
        <p className="text-xs leading-relaxed text-gray-600">{slide.body2}</p>
      </div>
    </section>
  );
}
