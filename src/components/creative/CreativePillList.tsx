"use client";

import { Brain, ChevronsRight, ListChecks, Workflow } from "lucide-react";
import Link from "next/link";

interface Pill {
  label: string;
  icon: typeof Brain;
  href: string;
  bg: string;
  ring: string;
}

const PILLS: Pill[] = [
  {
    label: "MindMap Brainstorming",
    icon: Brain,
    href: "/mind-map",
    bg: "#f8dadb",
    ring: "#e9a3a6",
  },
  {
    label: "Summarise Your MindMap",
    icon: ListChecks,
    href: "/summarise",
    bg: "#dde6f6",
    ring: "#a9bfe6",
  },
  {
    label: "Plan Your Execution",
    icon: Workflow,
    href: "/plan",
    bg: "#f7e7b4",
    ring: "#e6c976",
  },
];

interface Props {
  /** Index of the active pill (highlighted). */
  active?: number;
  /** When provided, pills act as tabs (buttons). Otherwise they are links. */
  onSelect?: (index: number) => void;
  /** Render compact icon-only squares (for the collapsed sidebar rail). */
  iconOnly?: boolean;
}

export default function CreativePillList({
  active,
  onSelect,
  iconOnly = false,
}: Props) {
  return (
    <div className={`flex flex-col ${iconOnly ? "gap-2" : "gap-3.5"}`}>
      {PILLS.map((pill, i) => {
        const Icon = pill.icon;
        const isActive = active === i;

        const inner = iconOnly ? (
          <Icon
            key={pill.label}
            size={18}
            strokeWidth={2.2}
            className="text-gray-800"
          />
        ) : (
          <>
            <Icon
              size={18}
              strokeWidth={2.2}
              className="shrink-0 text-gray-800"
            />
            <span className="flex-1 text-sm font-bold text-gray-800">
              {pill.label}
            </span>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white">
              <ChevronsRight size={15} className="text-gray-500" />
            </span>
          </>
        );

        const className = iconOnly
          ? `grid h-11 w-11 place-items-center rounded-xl transition-all ${
              isActive ? "shadow-md ring-2" : "hover:shadow-sm"
            }`
          : `flex items-center gap-3 rounded-2xl px-5 py-4 text-left transition-all ${
              isActive ? "shadow-md ring-2" : "hover:shadow-sm"
            }`;
        const style = {
          backgroundColor: pill.bg,
          ...(isActive
            ? { boxShadow: undefined, "--tw-ring-color": pill.ring }
            : {}),
        } as React.CSSProperties;

        return onSelect ? (
          <button
            key={pill.label}
            type="button"
            onClick={() => onSelect(i)}
            className={className}
            style={style}
            aria-label={iconOnly ? pill.label : undefined}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={pill.label}
            href={pill.href}
            className={className}
            style={style}
            aria-label={iconOnly ? pill.label : undefined}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
