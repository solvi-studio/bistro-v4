// Production phase a task belongs to — drives which board column it shows in.
export type PlanPhase = "pre" | "production" | "post";

export interface PlanTask {
  id: string;
  text: string;
  scheduledDate?: string;
  scheduledStartTime?: string; // "HH:MM"
  scheduledEndTime?: string;   // "HH:MM"
  completed: boolean;
  colorTag: "pink" | "blue" | "yellow" | "default";
  phase: PlanPhase;
}

export interface CalendarEvent {
  id: string;
  /** Folder (creative script/idea) this event belongs to. */
  scriptId: string;
  date: string;
  /** Optional start time "HH:MM". */
  time?: string;
  /** Optional end time "HH:MM". */
  endTime?: string;
  title: string;
  notes: string[];
  location?: string;
  reminders?: string[];
}

// A calendar event joined with its folder's display info (title + colour),
// produced by the cross-folder aggregation for the calendar page.
export interface EnrichedCalendarEvent extends CalendarEvent {
  scriptTitle: string;
  colorTag: "blue" | "yellow" | "pink";
  /** Set when this entry is derived from a scheduled plan task (read-only). */
  taskId?: string;
  /** Production phase — drives filter + colour on the calendar page. */
  phase?: PlanPhase;
}

export type CalendarView = "monthly" | "weekly";
export type CalendarPageView = "day" | "3day" | "week" | "month";
