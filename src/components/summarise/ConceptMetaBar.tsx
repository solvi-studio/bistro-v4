import type { ConceptMeta } from "@/types/summarise";

interface Props {
  meta: ConceptMeta;
}

export default function ConceptMetaBar({ meta }: Props) {
  return (
    <div className="flex items-center gap-0 min-w-0">
      {/* Concept */}
      <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
        <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest shrink-0">
          Concept
        </span>
        <span className="text-xs text-gray-500 truncate" title={meta.concept}>
          {meta.concept}
        </span>
      </div>

      <div className="w-px h-4 bg-gray-200 mx-4 shrink-0" />

      {/* Tone */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">
          Tone
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {meta.tone}
        </span>
      </div>

      <div className="w-px h-4 bg-gray-200 mx-4 shrink-0" />

      {/* Target Audience */}
      <div className="flex items-baseline gap-1.5 shrink-0">
        <span className="text-[11px] font-semibold text-red-400 uppercase tracking-widest">
          Target Audience
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {meta.targetAudience}
        </span>
      </div>
    </div>
  );
}
