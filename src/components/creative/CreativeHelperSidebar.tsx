"use client";

import {
  Brain,
  ListChecks,
  Lock,
  PanelLeftClose,
  RotateCcw,
  Workflow,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import { SplitContext } from "@/components/mind-map/canvas/ResizableSplit";
import { getScripts } from "@/utils/creative";
import {
  getSummaryStatus,
  subscribeSummaryStatus,
} from "@/utils/summarise-service";

// Reactive summary status — drives which downstream stages are unlocked.
function useSummaryStatus() {
  return useSyncExternalStore(
    subscribeSummaryStatus,
    getSummaryStatus,
    () => null,
  );
}

// The three creative stages. Each is its own route; in tab mode (onSelect set)
// they act as buttons instead of navigating.
interface Step {
  href: string;
  icon: typeof Brain;
  label: string;
  bg: string;
  ring: string;
}

const STEPS: Step[] = [
  {
    href: "/mind-map",
    icon: Brain,
    label: "Brainstorm",
    bg: "#f8dadb",
    ring: "#e9a3a6",
  },
  {
    href: "/summarise",
    icon: ListChecks,
    label: "Summarise",
    bg: "#dde6f6",
    ring: "#a9bfe6",
  },
  {
    href: "/plan",
    icon: Workflow,
    label: "Plan",
    bg: "#f7e7b4",
    ring: "#e6c976",
  },
];

interface Props {
  /** Active step index — overrides route-based highlight (tab mode). */
  active?: number;
  /** When set, steps act as tabs (buttons). Otherwise they link to routes. */
  onSelect?: (index: number) => void;
  /** Show the "Creative Flow" reminder card at the bottom. */
  showReminder?: boolean;
  /** Content rendered below the step tabs (e.g. the mind-map shortlist). */
  children?: ReactNode;
  /**
   * Embedded inside another resizable panel (the mind-map canvas split): fill
   * the container and let the parent own collapsing — no own width or rail.
   */
  embedded?: boolean;
}

// ── Step tabs row (HelperPanel-style equal-width tabs) ──────────────────────

function StepTabs({
  activeIndex,
  onSelect,
  scriptQuery = "",
  locks,
  iconOnly = false,
}: {
  activeIndex?: number;
  onSelect?: (index: number) => void;
  /** `?script=<id>` to preserve the active idea across step navigation. */
  scriptQuery?: string;
  /** Per-step lock reason (string) or null when unlocked. */
  locks?: (string | null)[];
  iconOnly?: boolean;
}) {
  return (
    <div className={`flex ${iconOnly ? "flex-col gap-2" : "gap-1.5"}`}>
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const isActive = activeIndex === i;
        const lockReason = !isActive ? (locks?.[i] ?? null) : null;
        const className = iconOnly
          ? "grid h-10 w-10 place-items-center rounded-lg transition-all"
          : "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all";
        const style = (
          isActive
            ? {
                backgroundColor: step.bg,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                "--tw-ring-color": step.ring,
              }
            : {}
        ) as React.CSSProperties;
        const stateCls = isActive
          ? "text-gray-800 ring-1"
          : "text-gray-500 hover:bg-gray-100";

        const inner = (
          <>
            {lockReason ? (
              <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            ) : (
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            )}
            {!iconOnly && <span>{step.label}</span>}
          </>
        );

        // Locked → inert span (no navigation), greyed with a tooltip reason.
        if (lockReason) {
          return (
            <span
              key={step.href}
              aria-disabled="true"
              title={lockReason}
              className={`${className} cursor-not-allowed text-gray-300`}
            >
              {inner}
            </span>
          );
        }

        return onSelect ? (
          <button
            key={step.href}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={step.label}
            className={`${className} ${stateCls}`}
            style={style}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={step.href}
            href={`${step.href}${scriptQuery}`}
            aria-label={step.label}
            className={`${className} ${stateCls}`}
            style={style}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────

export default function CreativeHelperSidebar({
  active,
  onSelect,
  children,
  embedded = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const summaryStatus = useSummaryStatus();
  const split = useContext(SplitContext);
  const [collapsed, setCollapsed] = useState(false);

  // Collapse handler: embedded → the canvas split; standalone → own rail.
  const collapse = embedded ? split?.collapse : () => setCollapsed(true);

  // Carry the active idea (?script=<id>) across step navigation so switching
  // stages keeps the user in their current script instead of the default map.
  const scriptId = params.get("script");
  const scriptQuery = scriptId ? `?script=${encodeURIComponent(scriptId)}` : "";
  const scriptTitle = scriptId
    ? (getScripts().find((s) => s.id === scriptId)?.title ?? null)
    : null;

  // Tab mode uses the `active` prop; link mode derives it from the route.
  const activeIndex = onSelect
    ? active
    : STEPS.findIndex((s) => pathname.startsWith(s.href));

  // Gate downstream stages so users can't jump ahead before the data exists.
  // Only in link mode — tab mode (guide) drives instruction steps, not routes.
  //   • Summarise: needs the mind map finalised (a summary job exists).
  //   • Plan: needs the summary finished.
  const locks: (string | null)[] = onSelect
    ? []
    : [
        null,
        summaryStatus ? null : "Finalise your mind map first",
        summaryStatus === "done"
          ? null
          : summaryStatus === "pending"
            ? "Summary is still generating…"
            : "Summarise your idea first",
      ];

  function rewatch() {
    router.push("/creative/guide?rewatch=1");
  }

  // Collapsed rail — only for the standalone (non-embedded) sidebar; the canvas
  // split provides its own collapse when embedded.
  if (collapsed && !embedded) {
    return (
      <aside className="flex h-full w-12 shrink-0 flex-col items-center gap-3 border-r border-gray-100 bg-white py-4">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Collapse Creative Helper"
          className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
        >
          <PanelLeftClose size={18} />
        </button>
        <StepTabs
          activeIndex={activeIndex}
          onSelect={onSelect}
          scriptQuery={scriptQuery}
          locks={locks}
          iconOnly
        />

        <button
          type="button"
          onClick={rewatch}
          aria-label="Watch guide"
          className="mt-auto grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <RotateCcw size={15} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={`relative z-10 flex h-full min-h-0 shrink-0 flex-col border-r border-gray-100 bg-white font-[var(--font-poppins)] ${
        embedded ? "w-full" : "w-[340px]"
      }`}
    >
      {/* Header — collapse button sits on the right, in normal flow. */}
      <div className="flex shrink-0 items-center border-b border-gray-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          {scriptTitle && (
            <Image
              src="/icon/glyphs-poly_sparkle.png"
              alt=""
              width={20}
              height={20}
              className="shrink-0"
            />
          )}
          {scriptTitle ?? "Your Creative Helper"}
        </h2>
        {collapse && (
          <button
            type="button"
            onClick={collapse}
            aria-label="Collapse Creative Helper"
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      {/* Step tabs */}
      <div className="shrink-0 border-b border-gray-100 bg-gray-50/60 p-3">
        <StepTabs
          activeIndex={activeIndex}
          onSelect={onSelect}
          scriptQuery={scriptQuery}
          locks={locks}
        />
      </div>

      {/* Content below the tabs — e.g. the mind-map shortlist */}
      {children && (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      )}

      {/* Flow reminder + watch guide (watch guide always visible) */}
      {/* <div
        className={`flex shrink-0 flex-col px-5 pb-5 ${children ? "" : "flex-1"}`}
      >
        {showReminder && <CreativeFlowReminder />}
        <button
          type="button"
          onClick={rewatch}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
        >
          <RotateCcw size={15} />
          Watch guide
        </button>
      </div> */}
    </aside>
  );
}
