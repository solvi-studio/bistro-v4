"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import {
  useOnboardingStore,
  selectCanAdvance,
  selectCanRetreat,
} from "@/store/onboardingStore";
import { markOnboardingDone } from "@/utils/onboarding";
import NameScreen from "./screens/NameScreen";
import ContentScreen from "./screens/ContentScreen";
import PainScreen from "./screens/PainScreen";
import LoadingScreen from "./screens/LoadingScreen";
import SummaryScreen from "./screens/SummaryScreen";

const BackgroundCanvas = dynamic(() => import("./t3-empty/backgroundCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-linear-to-br from-indigo-50 to-purple-50" />
  ),
});

type Props = { onComplete: () => void };

export default function OnboardingFlow({ onComplete }: Props) {
  const { user } = useUser();
  const {
    currentScreen,
    advance,
    retreat,
    name,
    contentTypes,
    painPoints,
    tiktokUrl,
  } = useOnboardingStore();

  const canAdvance = useOnboardingStore(selectCanAdvance);
  const canRetreat = useOnboardingStore(selectCanRetreat);

  const handleFinish = useCallback(async () => {
    if (!user) return;
    await markOnboardingDone(
      async (metadata) => { await user.update({ unsafeMetadata: { ...user.unsafeMetadata, ...metadata } }); },
      { name, dataLane: contentTypes, challenge: painPoints, tiktokUrl },
    );
    onComplete();
  }, [contentTypes, name, onComplete, painPoints, tiktokUrl, user]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.defaultPrevented ||
        event.isComposing ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-enter-skip="true"]')
      )
        return;

      if (currentScreen === "summary") {
        handleFinish();
        event.preventDefault();
      } else if (canAdvance && currentScreen !== "loading") {
        advance();
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentScreen, canAdvance, advance, handleFinish]);

  return (
    <div className="fixed inset-0 z-[99999] bg-white font-poppins flex items-center justify-center overflow-hidden font-semibold">
      <BackgroundCanvas />
      <AnimatePresence mode="wait">
        {currentScreen === "name" && <NameScreen key="name" onNext={advance} />}
        {currentScreen === "content" && (
          <ContentScreen key="content" onNext={advance} />
        )}
        {currentScreen === "pain" && <PainScreen key="pain" onNext={advance} />}
        {currentScreen === "loading" && (
          <LoadingScreen key="loading" onDone={advance} />
        )}
        {currentScreen === "summary" && (
          <SummaryScreen key="summary" onFinish={handleFinish} />
        )}
      </AnimatePresence>
      {canRetreat && (
        <div className="fixed bottom-5 left-5 z-[100000]">
          <button
            type="button"
            data-enter-skip="true"
            onClick={retreat}
            className="rounded-full border border-[#c4d3ea] bg-white/95 px-5 py-2.5 text-[14px] font-semibold text-[#40526e] shadow-sm transition-all hover:bg-[#f3f7ff]"
          >
            ← Go back
          </button>
        </div>
      )}
    </div>
  );
}
