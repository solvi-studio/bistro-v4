import type { CalendarEvent } from "@/types/plan";

interface Props {
  event: CalendarEvent | null;
  date: string | null;
}

export default function EventDetailCard({ event, date }: Props) {
  // Fixed height on all states — prevents calendar row from jumping
  if (!date) {
    return (
      <div className="w-64 h-[200px] shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400 p-4 text-center">
        Select a day to see details
      </div>
    );
  }

  const [, , day] = date.split("-");

  return (
    <div className="w-64 h-[200px] shrink-0 rounded-2xl bg-[var(--color-soft-yellow)] border border-yellow-100 p-4 flex flex-col">
      {event ? (
        <>
          <div className="flex items-start justify-between mb-2 shrink-0">
            <div>
              <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                Date
              </p>
              <p className="text-3xl font-bold text-amber-800 leading-none mt-0.5">
                {parseInt(day, 10)}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full max-w-[100px] text-right leading-tight">
              {event.title}
            </span>
          </div>
          <ul className="text-[11px] text-amber-800 leading-relaxed space-y-1 list-disc list-inside overflow-y-auto flex-1">
            {event.notes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            Date
          </p>
          <p className="text-3xl font-bold text-amber-800 leading-none mt-0.5">
            {parseInt(day, 10)}
          </p>
          <p className="text-xs text-amber-600 mt-3 leading-relaxed">
            No events scheduled for this day.
          </p>
        </>
      )}
    </div>
  );
}
