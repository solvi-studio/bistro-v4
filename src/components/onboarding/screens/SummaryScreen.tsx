"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useOnboardingStore } from "@/store/onboardingStore";
import Blob from "../Blob";

export default function SummaryScreen({ onFinish }: { onFinish: () => void }) {
  const { name, contentTypes, tiktokUrl } = useOnboardingStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-full max-w-2xl px-8 flex flex-col items-center"
    >
      <Blob color="#fca5a5" className="w-50 h-50 -bottom-15 -left-15" />
      <Blob color="#86efac" className="w-50 h-50 -bottom-10 -right-10" />
      <div className="relative w-full flex flex-col items-center">
        <div className="flex justify-center mb-5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Completed</title>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h2 className="text-[32px] font-semibold text-[#1a1a1a] text-center mb-8 leading-tight">
          Here's what I'm setting up for you
        </h2>

        <div className="w-full rounded-[24px] bg-[#dce8fb] px-7 py-6 text-left mb-8">
          <div className="flex items-center gap-4 mb-5">
            <Image
              src="/icon/mascot.png"
              alt="avatar"
              className="h-14 w-14 shrink-0 rounded-full object-cover"
              width={56}
              height={56}
            />
            <span className="text-[26px] font-semibold text-[#0f172a]">
              {name || "You"}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-[15px] font-semibold text-[#0f172a] mb-2">
              Your Content Lane
            </p>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/70 px-4 py-1.5 text-[14px] text-[#52596b] font-semibold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[15px] font-semibold text-[#0f172a] mb-2">
              Your TikTok Link
            </p>
            <div className="rounded-[14px] bg-white/60 px-5 py-4">
              <p className="text-[14px] text-[#52596b] leading-[1.6] break-all">
                {tiktokUrl.trim() ? tiktokUrl : "Not provided"}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[13px] !font-light italic text-black leading-normal text-center">
            Does this feel right? Let's start working together to unravel these frictions
          </p>
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="rounded-[18px] bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold text-[22px] px-4 py-4 transition-colors shadow-md"
        >
          Proceed pls
        </button>
      </div>
    </motion.div>
  );
}
