export type PlanPhase = "pre" | "production" | "post";

export interface PlanTask {
  id: string;
  text: string;
  scheduledDate?: string;
  scheduledStartTime?: string; // "HH:MM"
  scheduledEndTime?: string; // "HH:MM"
  completed: boolean;
  colorTag: "pink" | "blue" | "yellow" | "default";
  phase: PlanPhase;
  notes?: string;
  location?: string;
  reminders?: string[];
}

// Kept until Phase 5 swaps the calendar to tasks — all callers replaced then.
export interface CalendarEvent {
  id: string;
  scriptId: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
  notes: string;
  location?: string;
  reminders?: string[];
}

// A calendar entry joined with its folder's display info (title + colour).
// Phase 5 will redefine this as a scheduled PlanTask + folder info once
// CalendarEvent is retired.
export interface EnrichedCalendarEvent extends CalendarEvent {
  scriptTitle: string;
  colorTag: "blue" | "yellow" | "pink";
  taskId?: string;
  phase?: PlanPhase;
}

export type CalendarView = "monthly" | "weekly";
export type CalendarPageView = "day" | "3day" | "week" | "month";
