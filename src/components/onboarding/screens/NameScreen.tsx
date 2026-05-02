"use client";

import { motion } from "framer-motion";
import { useOnboardingStore, selectCanAdvance } from "@/store/onboardingStore";
import MascotAvatar from "../MascotAvatar";
import Blob from "../Blob";

interface NameScreenProps {
  onNext: () => void;
}

export default function NameScreen({ onNext }: NameScreenProps) {
  const { name, setName } = useOnboardingStore();
  const canAdvance = useOnboardingStore(selectCanAdvance);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-3xl"
      >
        <Blob color="#f8a5a5" className="w-65 h-65 -bottom-16 -left-20" />
        <Blob color="#a8f0c0" className="w-50 h-50 -top-10 -right-10" />
        <div className="relative flex flex-col items-center">
          <MascotAvatar size={72} />
          <p className="text-[26px] text-[#1a1a1a] leading-[1.45] text-center">
            Before we build your creative playground together, I
          </p>
          <p className="text-[26px] text-[#1a1a1a] text-center mb-6">
            need to get a feel for your brain. Let's build this together!
          </p>

          <p className="text-[26px] text-[#1a1a1a] text-center mb-10">
            First, I want to get to know you. What should I call you?
          </p>
          <input
            className="w-11/12 rounded-full bg-[#eef0f6] px-6 py-4 text-[17px] font-semibold text-[#1a1a1a] outline-none placeholder:text-[#aaa]"
            placeholder="real name, alias, alter ego – all valid"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdvance) {
                onNext();
              }
            }}
          />
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
