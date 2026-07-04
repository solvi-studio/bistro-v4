"use client";

import { useRouter } from "next/navigation";
import type { CreativeScript } from "@/types/creative";
import { formatScriptDate } from "@/utils/creative";

const CARD_BG: Record<string, string> = {
  blue: "#e3ecfb",
  yellow: "#f8e7af",
  pink: "#f6d3d4",
};

interface Props {
  script: CreativeScript;
}

export default function IdeaCard({ script }: Props) {
  const router = useRouter();
  const bg = CARD_BG[script.colorTag ?? "blue"] ?? CARD_BG.blue;

  return (
    <button
      type="button"
      onClick={() =>
        router.push(`/brainstorm?script=${encodeURIComponent(script.id)}`)
      }
      className="flex aspect-square w-full flex-col rounded-[22px] p-5 text-left transition-transform hover:-translate-y-1 sm:aspect-auto sm:h-53.75 sm:w-full sm:p-6"
      style={{ backgroundColor: bg }}
    >
      <span className="text-2xl">{script.emoji ?? "✨"}</span>
      <div className="mt-auto">
        <p className="text-[17px] font-bold leading-tight text-gray-900">
          {script.title}
        </p>
        <p className="mt-1.5 text-[13px] text-gray-500">
          {formatScriptDate(script.createdAt)}
        </p>
      </div>
    </button>
  );
}
