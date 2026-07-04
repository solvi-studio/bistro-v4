import type { CalendarEvent, PlanTask } from "@/types/plan";

interface Props {
  event: CalendarEvent | null;
  tasks?: PlanTask[];
  date: string | null;
}

const PHASE_LABEL: Record<PlanTask["phase"], string> = {
  pre: "Pre",
  production: "Production",
  post: "Post",
};

export default function EventDetailCard({ event, tasks = [], date }: Props) {
  // Fixed height on all states — prevents calendar row from jumping
  if (!date) {
    return (
      <div className="w-64 h-[200px] shrink-0 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs text-gray-400 p-4 text-center">
        Select a day to see details
      </div>
    );
  }

  const [, , day] = date.split("-");
  const hasContent = !!event || tasks.length > 0;

  return (
    <div className="w-64 h-[200px] shrink-0 rounded-2xl bg-[var(--color-soft-yellow)] border border-yellow-100 p-4 flex flex-col">
      <div className="flex items-start justify-between mb-2 shrink-0">
        <div>
          <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
            Date
          </p>
          <p className="text-3xl font-bold text-amber-800 leading-none mt-0.5">
            {parseInt(day, 10)}
          </p>
        </div>
        {event && (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full max-w-[100px] text-right leading-tight">
            {event.title}
          </span>
        )}
      </div>

      {hasContent ? (
        <div className="overflow-y-auto flex-1 space-y-2">
          {tasks.length > 0 && (
            <ul className="space-y-1">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-1.5 text-[11px] text-amber-800"
                >
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                    {PHASE_LABEL[t.phase]}
                  </span>
                  <span
                    className={t.completed ? "line-through opacity-60" : ""}
                  >
                    {t.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {event?.notes && (
            <p className="text-[11px] text-amber-800 leading-relaxed">
              {event.notes}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-amber-600 mt-3 leading-relaxed">
          Nothing scheduled for this day.
        </p>
      )}
    </div>
  );
}
