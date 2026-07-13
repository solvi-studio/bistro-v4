"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useUiStore } from "@/hooks/useUiStore";

const EDGE_THRESHOLD = 120; // px from edge to flip
const TEXT_OFFSET = 16; // px gap from cursor center

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);
  const cursorText = useUiStore((s) => s.cursorText);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    const textEl = textRef.current;
    if (!cursor || !follower || !textEl) return;

    gsap.set([cursor, follower, textEl], { opacity: 0 });
    gsap.set(follower, { xPercent: -50, yPercent: -50 });
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const prevPos = { x: 0, y: 0 };
    let isHovered = false;
    let restTimer: ReturnType<typeof setTimeout> | null = null;

    const resetStretch = () => {
      gsap.to(cursor, {
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.5)",
      });
    };

    const moveCursor = (e: MouseEvent): void => {
      const { clientX: x, clientY: y } = e;
      const nearRight = x > window.innerWidth - EDGE_THRESHOLD;
      const nearBottom = y > window.innerHeight - EDGE_THRESHOLD;

      if (!hasMovedRef.current) {
        hasMovedRef.current = true;
        prevPos.x = x;
        prevPos.y = y;
        gsap.set(cursor, { x, y });
        gsap.set(follower, { x, y });
        gsap.to([cursor, follower, textEl], { opacity: 1, duration: 0.6 });
      }

      const dx = x - prevPos.x;
      const dy = y - prevPos.y;
      prevPos.x = x;
      prevPos.y = y;

      // Only stretch when not hovering an interactive element
      if (!isHovered) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const distance = Math.sqrt(dx * dx + dy * dy) * 0.04;

        gsap.to(cursor, {
          rotate: angle,
          scaleX: 1 + Math.min(distance, 1),
          scaleY: 1 - Math.min(distance, 0.3),
          duration: 0.1,
          ease: "power2.out",
          overwrite: "auto",
        });

        // Reset stretch after mouse stops
        if (restTimer) clearTimeout(restTimer);
        restTimer = setTimeout(resetStretch, 80);
      }

      gsap.to(follower, { x, y, duration: 0.2, ease: "sine.out" });
      gsap.to(cursor, { x, y, duration: 0.2, overwrite: false });

      const textX = nearRight ? x - TEXT_OFFSET : x + TEXT_OFFSET;
      const textY = nearBottom ? y - TEXT_OFFSET : y + TEXT_OFFSET;

      gsap.to(textEl, {
        x: textX,
        y: textY,
        xPercent: nearRight ? -100 : 0,
        yPercent: nearBottom ? -100 : 0,
        duration: 0.25,
        ease: "sine.out",
      });
    };

    const onEnterInteractive = () => {
      isHovered = true;
      if (restTimer) clearTimeout(restTimer);
      // Reset stretch first, then shrink
      gsap.to(cursor, { scaleX: 1, scaleY: 1, rotate: 0, duration: 0.15 });
      gsap.to(follower, {
        scale: 2.5,
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, { scale: 0, duration: 0.2, delay: 0.05 });
    };

    const onLeaveInteractive = () => {
      isHovered = false;
      gsap.to(follower, {
        scale: 1,
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursor, { scale: 1, duration: 0.2 });
    };

    const addInteractiveListeners = () => {
      const interactives = document.querySelectorAll(
        "a, button, [data-cursor]",
      );
      interactives.forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    };

    addInteractiveListeners();

    const observer = new MutationObserver(addInteractiveListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("mousemove", moveCursor);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      if (restTimer) clearTimeout(restTimer);
      observer.disconnect();
      document.querySelectorAll("a, button, [data-cursor]").forEach((el) => {
        el.removeEventListener("mouseenter", onEnterInteractive);
        el.removeEventListener("mouseleave", onLeaveInteractive);
      });
    };
  }, []);

  // Fade text in/out when cursorText changes
  useEffect(() => {
    const textEl = textRef.current;
    if (!textEl || !hasMovedRef.current) return;
    if (cursorText) {
      gsap.to(textEl, {
        opacity: 1,
        y: "-=4",
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      gsap.to(textEl, { opacity: 0, duration: 0.35 });
    }
  }, [cursorText]);

  return (
    <div className="sm-md:hidden z-10">
      <div
        ref={followerRef}
        className="w-[50px] h-[50px] rounded-full bg-transparent border-white border-2 border-solid fixed z-50 mix-blend-difference pointer-events-none"
      />
      <div
        ref={cursorRef}
        className="w-[15px] h-[15px] rounded-full bg-white fixed z-50 mix-blend-difference pointer-events-none"
      />
      <div
        ref={textRef}
        className={`opacity-0 fixed z-50 pointer-events-none text-xs font-medium tracking-wide text-white mix-blend-difference whitespace-nowrap ${cursorText ? "p-1 bg-amber-500" : ""}`}
      >
        {cursorText}
      </div>
    </div>
  );
};

export default CustomCursor;
