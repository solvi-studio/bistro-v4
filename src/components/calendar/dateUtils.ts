import {
  addDays as dfAddDays,
  eachDayOfInterval,
  format,
  startOfWeek as dfStartOfWeek,
} from "date-fns";

// Constants kept for display in components that need indexed access.
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DOW_TINY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

// Intentionally local-time: parseISO returns UTC which shifts dates across TZ boundaries.
export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d: Date): Date {
  return dfStartOfWeek(d, { weekStartsOn: 0 });
}

export function addDays(d: Date, n: number): Date {
  return dfAddDays(d, n);
}

export function weekDays(start: Date): Date[] {
  return eachDayOfInterval({ start, end: dfAddDays(start, 6) });
}

// Month grid: 6 weeks × 7 cells, null for leading/trailing blanks.
export function monthCells(year: number, month: number): (number | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
}

export function nDays(start: Date, n: number): Date[] {
  return eachDayOfInterval({ start, end: dfAddDays(start, n - 1) });
}

// "9 AM", "12 PM", "2 PM" etc. — takes integer hour, not Date.
export function fmtHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// "HH:MM" → "9 AM", "2:30 PM" etc. — takes "HH:mm" string, not Date.
export function fmtTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const hr = h % 12 || 12;
  return m === 0 ? `${hr} ${ampm}` : `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function timeToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// "1 hour", "30 min", "1h 30m"
export function durationLabel(start: string, end: string): string {
  const mins = timeToMins(end) - timeToMins(start);
  if (mins <= 0) return "";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hour${h > 1 ? "s" : ""}` : `${h}h ${m}m`;
}

// "Thu March 19"
export function fmtDateLong(d: Date): string {
  return format(d, "EEE MMMM d");
}
