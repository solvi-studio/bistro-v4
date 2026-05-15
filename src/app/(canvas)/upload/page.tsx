"use client";

import { Upload } from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";

export default function UploadPage() {
  const name = useOnboardingStore((s) => s.name);
  const displayName = name.trim() || "name not found";

  return (
    <div className="px-12 py-10">
      <h1 className="text-[32px] font-bold tracking-tight">
        {displayName}&apos;s Canvas
      </h1>
      <p className="mb-8 text-[14px] text-[#52596b]">Recent Creative Ideas</p>

      <div className="max-w-3xl rounded-3xl bg-[#eef0f6] px-8 py-10">
        <h2 className="mb-1 text-center text-[22px] font-semibold text-[#1a1a1a]">
          Get inspiration from
        </h2>
        <p className="mb-8 text-center text-[22px] font-semibold text-[#1a1a1a]">
          your TikTok videos
        </p>

        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#d1d5db] bg-white/40 px-8 py-14">
          <Upload className="h-9 w-9 text-[#52596b]" strokeWidth={1.5} />
          <p className="text-[16px] font-semibold text-[#1a1a1a]">
            Drop your files
          </p>
          <p className="text-[13px] text-[#9ca3af]">
            any notes, videos, text, audio recording
          </p>
        </div>
      </div>
    </div>
  );
}
