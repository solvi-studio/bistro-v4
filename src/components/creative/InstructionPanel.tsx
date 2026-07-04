"use client";

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import {
  Brain,
  ListChecks,
  Workflow,
} from "lucide-react";
import { useLayoutEffect, useRef } from "react";

gsap.registerPlugin(SplitText);

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
        <span className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 md:text-[20px]">
          Clothing
        </span>
      </div>
      <div className="ml-16 mt-2 flex gap-2">
        <span className="rounded-lg bg-[#dde6f6] px-2.5 py-1 text-sm font-medium text-gray-700 md:text-[20px]">
          Ons shoes
        </span>
        <span className="rounded-lg bg-[#dde6f6] px-2.5 py-1 text-sm font-medium text-gray-700 md:text-[20px]">
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
        <span className="rounded-2xl rounded-tl-sm bg-gray-100 px-3 py-2 text-xs text-gray-600 md:text-[20px]">
          What's your overarching theme for this story?
        </span>
      </div>
      <div className="mt-2 flex justify-end">
        <span className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[#dde6f6] px-3 py-2 text-xs text-gray-700 md:text-[20px]">
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
        <span className="rounded-full bg-primary px-4 py-1 text-[10px] font-semibold text-white">
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
      <div className="w-20 rounded-lg bg-[#dde6f6] p-2">
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
        <div className="anim-mockup"><ChatMock /></div>
        <div className="anim-mockup"><MiniMindMap /></div>
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <div className="anim-mockup"><MiniMindMap /></div>
        <div className="anim-mockup"><MiniTable /></div>
      </>
    );
  }
  return (
    <>
      <div className="anim-mockup"><MiniTaskList /></div>
      <div className="anim-mockup"><MiniCalendar /></div>
    </>
  );
}

// ─── Panel ──────────────────────────────────────────────────────────────────

interface Props {
  active: number;
  direction: "forward" | "back";
  onToggleCollapse: () => void;
}

export default function InstructionPanel({ active, direction, onToggleCollapse }: Props) {
  const slide = SLIDES[active];
  const Icon = slide.icon;
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const xFrom = direction === "forward" ? 28 : -28;

    // Declared outside context so cleanup closure can reach them.
    let titleSplit: ReturnType<typeof SplitText.create> | undefined;
    let body1Split: ReturnType<typeof SplitText.create> | undefined;
    let body2Split: ReturnType<typeof SplitText.create> | undefined;

    const ctx = gsap.context(() => {
      const scope = sectionRef.current!;
      const titleEl  = scope.querySelector<HTMLElement>(".anim-title h3");
      const body1El  = scope.querySelector<HTMLElement>(".anim-body1");
      const body2El  = scope.querySelector<HTMLElement>(".anim-body2");

      if (!titleEl || !body1El || !body2El) return;

      // type "chars, words" preserves word spacing when splitting to chars.
      titleSplit = SplitText.create(titleEl,  { type: "chars, words" });
      body1Split = SplitText.create(body1El,  { type: "chars, words" });
      body2Split = SplitText.create(body2El,  { type: "chars, words" });

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // t=0.0  panel slides in from direction
      tl.from(".anim-panel", { x: xFrom, autoAlpha: 0, duration: 0.4 })
        // t=0.2  icon pops in
        .from(".anim-title svg", { autoAlpha: 0, scale: 0.8, duration: 0.3 }, 0.2)
        // t=0.3  title chars stream left → right
        .from(titleSplit.chars, { autoAlpha: 0, x: -10, stagger: 0.02, duration: 0.35 }, 0.3)
        // t=0.75 body1 chars flow left → right
        .from(body1Split.chars, { autoAlpha: 0, x: -6, stagger: 0.005, duration: 0.25 }, 0.75)
        // t=1.2  mockup panels rise up, staggered
        .from(".anim-mockup", { y: 18, autoAlpha: 0, stagger: 0.28, duration: 0.55 }, 1.2)
        // t=2.0  body2 chars flow left → right  (~ends 2.95s)
        .from(body2Split.chars, { autoAlpha: 0, x: -6, stagger: 0.005, duration: 0.25 }, 2.0);
    }, sectionRef);

    return () => {
      // Revert SplitText first — restores original DOM before context kills tweens.
      titleSplit?.revert();
      body1Split?.revert();
      body2Split?.revert();
      ctx.revert();
    };
  }, [active, direction]);

  return (
    <section ref={sectionRef} className="flex flex-1 flex-col">
      <header className="mb-4 flex items-center gap-2 md:mb-5">
        <h2 className="flex-1 text-base font-bold text-gray-800 md:text-lg">Instruction</h2>
        {/* Step dots — visible only on mobile where sidebar is hidden */}
        <div className="flex gap-1.5 md:hidden">
          {SLIDES.map((_, i) => (
            <span
              key={`dot-${i}`}
              className={`h-2 w-2 rounded-full transition-colors ${i === active ? "bg-primary" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </header>

      <div
        className="anim-panel flex flex-col gap-3 rounded-2xl p-4 md:gap-4 md:p-6"
        style={{ backgroundColor: slide.panelBg }}
      >
        <div className="anim-title flex items-center gap-2">
          <Icon size={18} className="shrink-0 text-gray-800 md:size-5" strokeWidth={2.2} />
          <h3 className="text-lg font-bold text-gray-800 md:text-2xl">{slide.title}</h3>
        </div>
        <p className="anim-body1 text-base leading-relaxed text-gray-600 md:text-xl">{slide.body1}</p>
        <SlideMockups index={active} />
        <p className="anim-body2 text-base leading-relaxed text-gray-600 md:text-xl">{slide.body2}</p>
      </div>
    </section>
  );
}
