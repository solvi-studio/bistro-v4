"use client";

import { motion } from "framer-motion";
import { useOnboardingStore, selectCanAdvance } from "@/store/onboardingStore";
import MascotAvatar from "../MascotAvatar";
import Blob from "../Blob";

const LANE_EMOJIS: Record<string, string> = {
  "Educational bites": "📚",
  "Short-form cheap eats": "🍔",
  "Travel Tips": "✈️",
};

export default function ContentScreen({ onNext }: { onNext: () => void }) {
  const {
    name,
    contentTypes,
    addContentType,
    removeContentType,
    setContentTypes,
    othersExpanded,
    setOthersExpanded,
    othersText,
    setOthersText,
  } = useOnboardingStore();
  const canAdvance = useOnboardingStore(selectCanAdvance);

  const toggleContentType = (opt: string) => {
    if (contentTypes.includes(opt)) {
      removeContentType(opt);
    } else {
      addContentType(opt);
    }
  };

  const handleOthersChange = (value: string) => {
    setOthersText(value);
    const withoutOthers = contentTypes.filter(
      (t) => !t.startsWith("Others:") && t !== "Others",
    );
    const parts = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const newTypes =
      parts.length > 0
        ? [...withoutOthers, ...parts.map((p) => `Others: ${p}`)]
        : withoutOthers;
    setContentTypes(newTypes);
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
        <Blob color="#f5d88a" className="w-55 h-55 -bottom-10 -left-16" />
        <Blob color="#93c5fd" className="w-50 h-50 -top-8 -right-8" />
        <div className="relative">
          <MascotAvatar size={72} />
          <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-7 leading-[1.45]">
            Hey {name}!<br />
            What kind of <em>things</em> do you create and bring to life?
          </p>
          <div className="flex flex-col gap-3 items-center">
            {["Educational bites", "Short-form cheap eats", "Travel Tips"].map(
              (opt) => {
                const selected = contentTypes.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleContentType(opt)}
                    className={`w-11/12 rounded-full px-6 py-4 text-[17px] text-left transition-all border flex items-center justify-between ${
                      selected
                        ? "bg-[#dce8fb] border-[#1363f8] text-[#0f172a] font-semibold"
                        : "bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span>{LANE_EMOJIS[opt]}</span>
                      <span>{opt}</span>
                    </span>
                    {selected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#3b7cf4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <title>Selected</title>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              },
            )}

            {/* Others — expands to text input when clicked */}
            {othersExpanded ? (
              <div className="w-11/12 flex flex-col">
                <input
                  className="w-full rounded-full bg-[#dce8fb] border border-[#1363f8] px-6 py-4 text-[17px] text-[#0f172a] outline-none placeholder:text-[#9bafc8]"
                  placeholder="e.g. cooking, fitness, gaming"
                  value={othersText}
                  onChange={(e) => handleOthersChange(e.target.value)}
                />
                <p className="text-[12px] text-[#9bafc8] mt-1.5 pl-4">
                  Separate multiple with commas
                </p>
                {othersText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pl-2">
                    {othersText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                      .map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-white/70 px-3 py-1 text-[13px] text-[#52596b] font-semibold border border-[#c2d6f4]"
                        >
                          #Others: {p}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOthersExpanded(true)}
                className="w-11/12 rounded-full px-6 py-4 text-[17px] text-left transition-all border bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7] flex items-center gap-3"
              >
                <span>•••</span>
                <span>Others</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
      <div className="fixed bottom-5 right-5 z-[100000]">
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className="w-10 h-10 rounded-full bg-[#3b7cf4] flex items-center justify-center text-white text-[20px] font-semibold shadow-md transition-all hover:bg-[#2f67dc] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </>
  );
}
