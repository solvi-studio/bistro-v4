import type { ShotData } from "@/types/summarise";
import ShotTableRow from "./ShotTableRow";

interface Props {
  shots: ShotData[];
}

const COLUMNS = [
  "Shot Number",
  "Time",
  "Description",
  "Shooting Style",
  "Audio",
  "Script",
];

function Header() {
  return (
    <div className="grid grid-cols-[80px_90px_1fr_140px_140px_1fr] gap-6 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
      {COLUMNS.map((col) => (
        <span
          key={col}
          className="text-sm font-semibold text-gray-700 font-(--font-poppins)"
        >
          {col}
        </span>
      ))}
    </div>
  );
}

export default function ShotTable({ shots }: Props) {
  return (
    <div className="min-w-215">
      <Header />
      {shots.map((shot, i) => (
        <ShotTableRow
          key={shot.shotNumber}
          shot={shot}
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}
