import type { ShotData } from "@/types/summarise";
import StoryboardCell from "./StoryboardCell";

interface Props {
  shot: ShotData;
  style?: React.CSSProperties;
}

export default function ShotTableRow({ shot, style }: Props) {
  return (
    <div
      className="grid grid-cols-[80px_100px_1fr_120px_120px_1fr] gap-4 py-5 border-b border-gray-100 items-start"
      style={style}
    >
      <span className="text-sm text-gray-500 text-center pt-1">
        {shot.shotNumber}
      </span>

      <StoryboardCell
        url={shot.storyboardUrl}
        alt={`Shot ${shot.shotNumber} storyboard`}
      />

      <p className="text-sm text-gray-600 leading-relaxed">
        {shot.description}
      </p>

      <span className="text-sm text-gray-600 text-center">
        {shot.shootingStyle}
      </span>

      <span className="text-sm text-gray-600 text-center">
        {shot.cameraAngle}
      </span>

      <ul className="list-disc list-inside text-sm text-gray-600 leading-relaxed space-y-0.5">
        {shot.script.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
