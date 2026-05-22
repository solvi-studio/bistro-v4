"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SummariseLoadState } from "@/types/summarise";
import { getSummariseData } from "@/utils/plan";
import ConceptMetaBar from "./ConceptMetaBar";
import ShotTable from "./ShotTable";
import SummariseSkeleton from "./SummariseSkeleton";

export default function SummarisePageClient() {
  const [loadState, setLoadState] = useState<SummariseLoadState>("loading");
  const data = useRef(getSummariseData());
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setLoadState("ready"), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: "#FAFAFB",
        fontFamily: "var(--font-poppins), Poppins, sans-serif",
      }}
    >
      {/* Page header */}
      <div className="px-8 pt-7 pb-4 shrink-0">
        <h1 className="text-2xl text-gray-800" style={{ fontWeight: 500 }}>
          Summarise your idea
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {loadState === "loading" ? (
          <motion.div
            key="skeleton"
            className="flex-1 flex flex-col min-h-0 mx-8 mb-8 rounded-2xl bg-white overflow-hidden border border-gray-200 shadow-sm"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Skeleton project badge */}
            <div className="px-6 pt-5 pb-4 shrink-0 border-b border-gray-100 flex items-center gap-3">
              <div className="animate-shimmer h-6 w-28 rounded-full" />
            </div>
            <SummariseSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex-1 flex flex-col min-h-0 mx-8 mb-8 rounded-2xl bg-white overflow-hidden border border-gray-200 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Project badge + concept meta */}
            <div className="px-6 pt-5 pb-3 shrink-0 border-b border-gray-100 flex items-center gap-4">
              <motion.span
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="inline-flex items-center gap-1.5 bg-[var(--color-primary)] text-white text-xs px-3 py-1.5 rounded-full shrink-0"
                style={{ fontWeight: 600 }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M6 1l1.03 3.17L10.2 5l-3.17 1.03L6 9.2 4.97 6.03 1.8 5l3.17-1.03L6 1z"
                    fill="white"
                  />
                </svg>
                {data.current.meta.projectName}
              </motion.span>

              <ConceptMetaBar meta={data.current.meta} />
            </div>

            {/* Scrollable table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 px-6">
              <ShotTable shots={data.current.shots} />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-between shrink-0 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push("/mind-map")}
                className="px-6 py-2.5 rounded-full bg-gray-500 text-gray-100 text-sm hover:bg-gray-700 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Back to Canvas
              </button>
              <button
                type="button"
                onClick={() => router.push("/plan")}
                className="px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm hover:bg-[var(--color-primary-hover)] transition-colors"
                style={{ fontWeight: 600 }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
