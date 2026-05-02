"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useOnboardingStore, selectCanAdvance } from "@/store/onboardingStore";
import Blob from "../Blob";

const CHARACTERS = [
  { label: "The Chef", bg: "#fef3e2", ref: "chef" },
  { label: "The Scholar", bg: "#e8f4fd", ref: "scholar" },
  { label: "The Explorer", bg: "#e8f8f0", ref: "explorer" },
  { label: "The Creator", bg: "#fde8f0", ref: "creator" },
  { label: "The Traveler", bg: "#f3e8fd", ref: "traveler" },
];

export default function CharacterScreen({ onNext }: { onNext: () => void }) {
  const { character, setCharacter } = useOnboardingStore();
  const canAdvance = useOnboardingStore(selectCanAdvance);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-150 px-8"
      >
        <Blob color="#fbb6ce" className="w-50 h-50 -top-8 -left-12" />
        <Blob color="#93c5fd" className="w-50 h-50 -bottom-8 -right-8" />
        <div className="relative">
          <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-8 leading-[1.45]">
            Now pick your own character that represents <em>you</em> the most...
          </p>
          <div className="grid grid-cols-3 space-x-6 mb-4">
            {CHARACTERS.slice(0, 3).map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCharacter(i)}
                className={`relative flex flex-col items-center p-3 rounded-[18px] transition-all border-2 ${
                  character === i
                    ? "border-[#3b7cf4] bg-[#dce8fb]/40"
                    : "border-transparent"
                }`}
              >
                {character === i && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#3b7cf4] text-white flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Selected</title>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                <div className="w-35 h-35 rounded-full overflow-hidden">
                  <Image
                    src={`/icon/${c.ref}.png`}
                    alt={c.ref}
                    className="h-full w-full object-cover"
                    width={140}
                    height={140}
                  />
                </div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 px-10">
            {CHARACTERS.slice(3).map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCharacter(i + 3)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-[18px] transition-all border-2 ${
                  character === i + 3
                    ? "border-[#3b7cf4] bg-[#dce8fb]/40"
                    : "border-transparent"
                }`}
              >
                {character === i + 3 && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#3b7cf4] text-white flex items-center justify-center">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Selected</title>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                <div className="w-32 h-32 rounded-full overflow-hidden">
                  <Image
                    src={`/icon/${c.ref}.png`}
                    alt={c.ref}
                    className="h-full w-full object-cover"
                    width={128}
                    height={128}
                  />
                </div>
              </button>
            ))}
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
