"use client";

import { motion } from "framer-motion";
import { useOnboardingStore, selectCanAdvance } from "@/store/onboardingStore";
import MascotAvatar from "../MascotAvatar";
import Blob from "../Blob";

const PAIN_CHIPS = ["ideas", "creative fatigue", "content management"];
const CHIP_EMOJIS: Record<string, string> = {
  ideas: "🖼️",
  "creative fatigue": "😤",
  "content management": "📊",
};

export default function PainScreen({ onNext }: { onNext: () => void }) {
  const { painPoints, setPainPoints, tiktokUrl, setTiktokUrl } = useOnboardingStore();
  const canAdvance = useOnboardingStore(selectCanAdvance);

  const toggleChip = (chip: string) => {
    const parts = painPoints
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.includes(chip)) {
      setPainPoints(parts.filter((p) => p !== chip).join(", "));
    } else {
      setPainPoints([...parts, chip].join(", "));
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-180 px-8"
      >
        <Blob color="#fca5a5" className="w-55 h-55 -top-8 -left-12" />
        <Blob color="#86efac" className="w-50 h-50 -bottom-8 -right-8" />
        <div className="relative">
          <MascotAvatar size={130} />
          <p className="mb-2 text-center text-[26px] leading-[1.45] font-semibold text-[#1a1a1a]">
            Got it!
          </p>
          <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-6 leading-normal">
            Now drop your TikTok page to understand your existing taste?
          </p>
          <input
            className="w-full rounded-full bg-[#eef0f6] px-6 py-4 text-[17px] text-[#1a1a1a] outline-none placeholder:text-[#aaa] mb-4"
            placeholder="LINK drop here"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            inputMode="url"
            autoComplete="url"
          />
          <div className="flex flex-wrap justify-center gap-4">
            {PAIN_CHIPS.map((chip) => {
              const active = painPoints
                .split(",")
                .map((s) => s.trim())
                .includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`rounded-full px-5 py-2 text-[15px] transition-all border flex items-center gap-2 ${
                    active
                      ? "bg-[#dce8fb] border-[#3b7cf4] text-[#0f172a] font-semibold"
                      : "bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7]"
                  }`}
                >
                  <span>{CHIP_EMOJIS[chip]}</span>
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
      <div className="fixed bottom-5 right-5 z-[100000] flex items-center gap-3">
        <span className="text-[15px] font-semibold text-[#52596b]">This feels right!</span>
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          aria-label="Continue"
          className="w-10 h-10 rounded-full bg-[#3b7cf4] flex items-center justify-center text-white text-[20px] font-semibold shadow-md transition-all hover:bg-[#2f67dc] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </>
  );
}
