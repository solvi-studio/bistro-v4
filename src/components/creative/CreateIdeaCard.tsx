"use client";

import { Plus } from "lucide-react";

interface Props {
  onClick: () => void;
}

export default function CreateIdeaCard({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-[22px] bg-[#e3ecfb] p-5 transition-transform hover:-translate-y-1 sm:aspect-auto sm:h-[215px] sm:w-[225px] sm:gap-5 sm:p-6"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-sm">
        <Plus size={26} className="text-gray-800" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-semibold text-gray-800">
        Create your new shotlist
      </span>
    </button>
  );
}
