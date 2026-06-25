"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SummariseLoadState } from "@/types/summarise";
import { resumeSummary, type SummariseResult } from "@/utils/summarise-service";
import ShotTable from "./ShotTable";
import SummariseSkeleton from "./SummariseSkeleton";

export default function SummarisePageClient() {
  const [loadState, setLoadState] = useState<SummariseLoadState>("loading");
  // No seed/default — data is null until the backend responds.
  const [data, setData] = useState<SummariseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  // Carry the active idea across stages so Confirm/Back keep the same script.
  const script = params.get("script");
  const scriptQuery = script ? `?script=${encodeURIComponent(script)}` : "";

  useEffect(() => {
    let cancelled = false;
    // Resumes across reloads: returns the in-flight request, the stored result,
    // or a fresh re-fetch from the saved graph snapshot.
    const pending = resumeSummary();

    // Never submitted (e.g. direct visit) — nothing to show, bounce back.
    if (!pending) {
      router.replace(`/mind-map${scriptQuery}`);
      return;
    }

    // Wait for the real backend result; skeleton animates until it lands.
    pending
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Request failed");
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [router, scriptQuery]);

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
            <SummariseSkeleton />
          </motion.div>
        ) : loadState === "error" ? (
          <motion.div
            key="error"
            className="flex-1 flex flex-col items-center justify-center min-h-0 mx-8 mb-8 rounded-2xl bg-white overflow-hidden border border-gray-200 shadow-sm text-center px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-base text-gray-800" style={{ fontWeight: 600 }}>
              Couldn&apos;t generate your summary
            </p>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              The backend didn&apos;t respond. Make sure the API server is
              running, then try again.
            </p>
            {errorMsg && (
              <p className="mt-2 max-w-md text-xs text-gray-400 wrap-break-word">
                {errorMsg}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push(`/mind-map${scriptQuery}`)}
              className="mt-6 px-6 py-2.5 rounded-full bg-primary text-white text-sm hover:bg-(--color-primary-hover) transition-colors"
              style={{ fontWeight: 600 }}
            >
              Back to Canvas
            </button>
          </motion.div>
        ) : loadState === "ready" && data ? (
          <motion.div
            key="content"
            className="flex-1 flex flex-col min-h-0 mx-8 mb-8 rounded-2xl bg-white overflow-hidden border border-gray-200 shadow-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            {/* Scrollable table */}
            <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 px-6">
              <ShotTable shots={data.shots} />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex justify-end shrink-0 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push(`/plan${scriptQuery}`)}
                className="px-6 py-2.5 rounded-full bg-primary text-white text-sm hover:bg-(--color-primary-hover) transition-colors"
                style={{ fontWeight: 600 }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
