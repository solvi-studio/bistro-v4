"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { markGuideSeen } from "@/utils/creative";
import CreativeHelperSidebar from "./CreativeHelperSidebar";
import InstructionPanel from "./InstructionPanel";

const TOTAL_SLIDES = 3;

export default function CreativeGuideClient() {
  const router = useRouter();
  const params = useSearchParams();
  const folder = params.get("folder") ?? "f-default";
  const isRewatch = params.get("rewatch") === "1";

  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [collapsed, setCollapsed] = useState(false);

  const isLast = active === TOTAL_SLIDES - 1;

  function handleNext() {
    setDirection("forward");
    setActive((a) => Math.min(a + 1, TOTAL_SLIDES - 1));
  }

  function handleBack() {
    setDirection("back");
    setActive((a) => Math.max(a - 1, 0));
  }

  function handleSelect(i: number) {
    setDirection(i > active ? "forward" : "back");
    setActive(i);
  }

  function handleFinish() {
    if (isRewatch) {
      router.back();
      return;
    }
    markGuideSeen();
    router.replace(`/creative/new?folder=${encodeURIComponent(folder)}`);
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {!collapsed && (
        <div className="hidden md:flex">
          <CreativeHelperSidebar
            active={active}
            onSelect={handleSelect}
            showReminder={false}
          />
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-4 md:p-9">
          <InstructionPanel
            active={active}
            direction={direction}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </div>

        {/* 3-col footer: back | centered primary | spacer */}
        <div className="flex items-center px-4 pb-6 md:px-9 md:pb-9">
          <div className="w-20 md:w-28">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className={`min-h-11 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 md:px-5 md:py-3 ${active === 0 ? "invisible" : ""}`}
            >
              ← Back
            </button>
          </div>

          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={isLast ? handleFinish : handleNext}
              className="min-h-11 rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-(--color-primary-hover) md:py-3"
            >
              {isLast ? (isRewatch ? "Done" : "Get started") : "Continue"}
            </button>
          </div>

          <div className="flex w-20 justify-end md:w-28">
            {!isRewatch && (
              <button
                type="button"
                onClick={handleFinish}
                className="text-sm text-gray-400 underline-offset-2 transition-colors hover:text-gray-600 hover:underline"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
