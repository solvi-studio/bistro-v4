import Image from "next/image";
import {
  Bell,
  CalendarDays,
  Home,
  Lightbulb,
  MessageCircle,
  NotebookPen,
} from "lucide-react";
import { UserAvatar, UserButton, UserProfile } from "@clerk/nextjs";

const TOP_NAV = [
  { Icon: Home, label: "Home", active: true },
  { Icon: Lightbulb, label: "Ideas", active: false },
  { Icon: CalendarDays, label: "Calendar", active: false },
  { Icon: MessageCircle, label: "Chat", active: false },
] as const;

const BOTTOM_NAV = [
  { Icon: Bell, label: "Notifications" },
  { Icon: NotebookPen, label: "Notes" },
] as const;

export default function Sidebar() {
  return (
    <aside className="flex w-20 shrink-0 flex-col items-center gap-2 border-r border-[#f0f1f3] bg-white py-5">
      {TOP_NAV.map(({ Icon, label, active }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${
            active ? "bg-[#dce8fb]" : "hover:bg-[#f0f4fb]"
          }`}
        >
          <Icon className="h-6 w-6 text-[#3b7cf4]" strokeWidth={2} />
        </button>
      ))}
      <div className="flex-1" />
      {BOTTOM_NAV.map(({ Icon, label }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          className="grid h-11 w-11 place-items-center rounded-xl transition-colors hover:bg-[#f0f4fb]"
        >
          <Icon className="h-6 w-6 text-[#3b7cf4]" strokeWidth={2} />
        </button>
      ))}
      {/* <Image
        src="/icon/mascot.png"
        alt="Avatar"
        width={36}
        height={36}
        className="mt-2 rounded-full"
      /> */}
      <UserButton />
    </aside>
  );
}
