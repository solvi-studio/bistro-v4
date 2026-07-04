import type { ShotData } from "@/types/summarise";

interface Props {
  shot: ShotData;
  style?: React.CSSProperties;
}

export default function ShotTableRow({ shot, style }: Props) {
  return (
    <div
      className="grid grid-cols-[80px_90px_1fr_140px_140px_1fr] gap-6 py-5 border-b border-gray-100 items-start"
      style={style}
    >
      <span className="text-sm text-gray-500 pt-0.5">
        {shot.shotNumber}
      </span>

      <span className="text-sm text-gray-600 pt-0.5">
        {shot.time ?? "—"}
      </span>

      <p className="text-sm text-gray-600 leading-relaxed">
        {shot.description}
      </p>

      <span className="text-sm text-gray-600">
        {shot.shootingStyle}
      </span>

      <span className="text-sm text-gray-600">
        {shot.audio}
      </span>

      <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-0.5">
        {shot.script.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
