"use client";

import { UserButton } from "@clerk/nextjs";
import { CalendarDays, Home, Lightbulb } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getScripts } from "@/utils/creative";

const TOP_NAV = [
  { Icon: Home, label: "Home", href: "/creative" },
  { Icon: CalendarDays, label: "Calendar", href: "/calendar" },
] as const;

// { Icon: MessageCircle, label: "Chat", href: null },
// { Icon: Bell, label: "Notifications" },
// { Icon: NotebookPen, label: "Notes" },

// Most recent script's mind map, or the idea grid when none exist yet.
function recentMindMapHref(): string {
  const scripts = getScripts();
  if (scripts.length === 0) return "/creative";
  const latest = scripts.reduce((a, b) => (a.createdAt >= b.createdAt ? a : b));
  return `/mind-map?script=${encodeURIComponent(latest.id)}`;
}

export default function Sidebar() {
  const pathname = usePathname();

  // Computed after mount — scripts live in localStorage (client-only). Defaults
  // to /creative so the first render (and the empty state) has a valid target.
  const [ideasHref, setIdeasHref] = useState("/creative");
  useEffect(() => {
    setIdeasHref(recentMindMapHref());
  }, []);

  const cls = (active: boolean) =>
    `grid h-11 w-11 place-items-center rounded-xl transition-colors ${
      active ? "bg-[#dce8fb]" : "hover:bg-[#f0f4fb]"
    }`;

  return (
    <aside className="flex w-20 shrink-0 flex-col items-center gap-2 border-r border-[#f0f1f3] bg-white py-5">
      <Link
        href="/creative"
        aria-label="Home"
        className={cls(pathname.startsWith("/creative"))}
      >
        <Home className="h-6 w-6 text-[#3b7cf4]" strokeWidth={2} />
      </Link>

      {/* Ideas — jumps straight into the most recently edited mind map. */}
      <Link
        href={ideasHref}
        aria-label="Ideas"
        className={cls(pathname.startsWith("/mind-map"))}
      >
        <Lightbulb className="h-6 w-6 text-[#3b7cf4]" strokeWidth={2} />
      </Link>

      {TOP_NAV.slice(1).map(({ Icon, label, href }) => (
        <Link
          key={label}
          href={href}
          aria-label={label}
          className={cls(pathname.startsWith(href))}
        >
          <Icon className="h-6 w-6 text-[#3b7cf4]" strokeWidth={2} />
        </Link>
      ))}

      <div className="flex-1" />
      <UserButton />
    </aside>
  );
}
