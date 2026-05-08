"use client";

import Link from "next/link";
import { Filter, Plus, Search, Sun, Upload } from "lucide-react";
import { useOnboardingStore } from "@/store/onboardingStore";

const FILTER_PILLS = ["Recent Save", "Food", "Vacation"] as const;

export default function InspirationPage() {
  const name = useOnboardingStore((s) => s.name);
  const displayName = name.trim() || "name not found Trang";

  return (
    <div className="px-12 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Sun className="h-6 w-6 text-[#f59e0b]" strokeWidth={2} />
        <h1 className="text-[28px] font-bold tracking-tight">
          Good morning, {displayName}!
        </h1>
      </div>

      <div className="relative mb-6 max-w-3xl">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]"
          strokeWidth={2}
        />
        <input
          type="search"
          placeholder="Find out my specific videos..."
          className="w-full rounded-full bg-[#eef0f6] py-3 pl-12 pr-5 text-[15px] outline-none placeholder:text-[#9ca3af]"
        />
      </div>

      <div className="mb-8 flex max-w-3xl flex-wrap items-center gap-3">
        {FILTER_PILLS.map((label) => (
          <button
            key={label}
            type="button"
            className="rounded-full border border-[#e5e7eb] bg-white px-4 py-1.5 text-[14px] font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f3f4f6]"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-[#86efac] px-4 py-1.5 text-[14px] font-semibold text-[#0f172a] transition-colors hover:bg-[#6ee7a3]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add your cluster
        </button>
        <Link
          href="/upload"
          className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-4 py-1.5 text-[14px] font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f3f4f6]"
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          Upload video
        </Link>
        <button
          type="button"
          aria-label="Filter"
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg hover:bg-[#f3f4f6]"
        >
          <Filter className="h-5 w-5 text-[#3b7cf4]" strokeWidth={2} />
        </button>
      </div>

      <p className="text-[14px] text-[#52596b]">
        Drop more videos in your inspiration library
      </p>
    </div>
  );
}
