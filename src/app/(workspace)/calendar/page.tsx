import type { Metadata } from "next";
import { Suspense } from "react";
import CalendarPageClient from "@/components/calendar/CalendarPageClient";

export const metadata: Metadata = { title: "Calendar" };

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageClient />
    </Suspense>
  );
}
