"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { CalendarDays, Home, Lightbulb } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  clearLastOpenedFolder,
  getLastOpenedFolder,
} from "@/utils/recentFolder";

const TOP_NAV = [
  { Icon: Home, label: "Home", href: "/creative" },
  { Icon: CalendarDays, label: "Calendar", href: "/calendar" },
] as const;

// { Icon: MessageCircle, label: "Chat", href: null },
// { Icon: Bell, label: "Notifications" },
// { Icon: NotebookPen, label: "Notes" },

export default function Sidebar() {
  const pathname = usePathname();
  const { user, isSignedIn, isLoaded } = useUser();

  const [ideasHref, setIdeasHref] = useState("/creative");
  // Tracks whose folder-history is currently loaded so a sign-out can wipe
  // that account's entry — recentFolder.ts also namespaces by user id, so
  // a different user signing in on this browser never reads someone else's.
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user?.id) {
      lastUserId.current = user.id;
      const recent = getLastOpenedFolder(user.id);
      if (recent) {
        setIdeasHref(`/brainstorm?script=${encodeURIComponent(recent)}`);
      }
      return;
    }

    if (lastUserId.current) {
      clearLastOpenedFolder(lastUserId.current);
      lastUserId.current = null;
    }
    setIdeasHref("/creative");
  }, [isLoaded, isSignedIn, user?.id]);

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

      {/* Ideas — jumps straight into the most recently opened mind map. */}
      <Link
        href={ideasHref}
        aria-label="Ideas"
        className={cls(pathname.startsWith("/brainstorm"))}
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
