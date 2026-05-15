"use client";

import type { ConceptMeta } from "@/types/summarise";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface Props {
  meta: ConceptMeta;
}

interface StaticChipProps {
  label: string;
  value: string;
  chipCls: string;
  labelCls: string;
  valueCls: string;
}

function StaticChip({ label, value, chipCls, labelCls, valueCls }: StaticChipProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 ${chipCls}`}>
      <span className={`text-[10px] font-semibold uppercase tracking-widest ${labelCls}`}>
        {label}
      </span>
      <span className={`text-[11px] font-medium whitespace-nowrap ${valueCls}`}>
        {value}
      </span>
    </span>
  );
}

function ExpandableChip({ label, value, chipCls, labelCls, valueCls }: StaticChipProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full cursor-pointer select-none hover:brightness-95 ${chipCls}`}
      title={!expanded ? value : undefined}
    >
      <span className={`text-[10px] font-semibold uppercase tracking-widest shrink-0 ${labelCls}`}>
        {label}
      </span>
      <span
        className={`text-[11px] font-medium ${valueCls} ${
          expanded
            ? "whitespace-normal break-words"
            : "whitespace-nowrap max-w-[140px] truncate"
        }`}
      >
        {value}
      </span>
      <ChevronDown
        size={11}
        strokeWidth={2.5}
        className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${labelCls}`}
      />
    </button>
  );
}

export default function ConceptMetaBar({ meta }: Props) {
  return (
    <div className="flex flex-wrap gap-2 min-w-0">
      <ExpandableChip
        label="Concept"
        value={meta.concept}
        chipCls="bg-blue-50 border border-blue-100"
        labelCls="text-blue-400"
        valueCls="text-blue-700"
      />
      <StaticChip
        label="Tone"
        value={meta.tone}
        chipCls="bg-rose-50 border border-rose-100"
        labelCls="text-rose-400"
        valueCls="text-rose-700"
      />
      <StaticChip
        label="Audience"
        value={meta.targetAudience}
        chipCls="bg-amber-50 border border-amber-100"
        labelCls="text-amber-400"
        valueCls="text-amber-700"
      />
    </div>
  );
}
