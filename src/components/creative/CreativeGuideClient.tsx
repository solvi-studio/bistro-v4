"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { markGuideSeen } from "@/utils/creative";
import CreativeHelperSidebar from "./CreativeHelperSidebar";
import InstructionPanel from "./InstructionPanel";

export default function CreativeGuideClient() {
  const router = useRouter();
  const params = useSearchParams();
  const folder = params.get("folder") ?? "f-default";
  const isRewatch = params.get("rewatch") === "1";

  const [active, setActive] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  function handleFinish() {
    if (isRewatch) {
      // Replaying the guide — return to wherever the user came from.
      router.back();
      return;
    }
    markGuideSeen();
    // replace() so the guide is not in the back-history of the compose page.
    router.replace(`/creative/new?folder=${encodeURIComponent(folder)}`);
  }

  return (
    <div className="flex h-full">
      {!collapsed && (
        <CreativeHelperSidebar
          active={active}
          onSelect={setActive}
          showReminder={false}
        />
      )}

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 p-9">
          <InstructionPanel
            active={active}
            onToggleCollapse={() => setCollapsed((c) => !c)}
          />
        </div>
        <div className="flex justify-end px-9 pb-9">
          <button
            type="button"
            onClick={handleFinish}
            className="rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {isRewatch ? "Done" : "Get started"}
          </button>
        </div>
      </div>
    </div>
  );
}
