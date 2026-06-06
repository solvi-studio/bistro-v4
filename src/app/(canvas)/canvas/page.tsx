"use client";

import { useOnboardingStore } from "@/store/onboardingStore";
import CanvasCard from "@/components/canvas/CanvasCard";

const CARDS = [
  {
    title: "Inspiration Pools",
    counter: "1/2",
    description:
      "This is your space where you can upload your videos to get inspired",
    nextHref: "/inspiration",
  },
  {
    title: "Creativity Spaces",
    counter: "2/2",
    description:
      "This is your space where you can brainstorm your next cool ideas",
    nextHref: "/mind-map",
  },
] as const;

export default function CanvasPage() {
  const name = useOnboardingStore((s) => s.name);
  const displayName = name.trim() || "name not found";

  return (
    <div className="px-12 py-10">
      <h1 className="mb-10 text-[32px] font-bold tracking-tight">
        {displayName}&apos;s Canvas
      </h1>
      <div className="grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {CARDS.map((c) => (
          <CanvasCard key={c.title} {...c} />
        ))}
      </div>
    </div>
  );
}
