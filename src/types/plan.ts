export interface PlanTask {
  id: string;
  text: string;
  scheduledDate?: string;
  completed: boolean;
  colorTag: "pink" | "blue" | "yellow" | "default";
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  notes: string[];
}

export type CalendarView = "monthly" | "weekly";
