import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { useUiStore } from "@/hooks/useUiStore";

// ─── RunTextAnim ──────────────────────────────────────────────────────────────
//
// Renders `len` stacked copies of `text` inside an overflow:hidden slot.
// Animation (triggered after curtainDone):
//   - copies 0..len-2 enter from below, rise up, and exit above (roulette ticks)
//   - copy len-1 enters from below and STOPS in frame (final position)
//
// `total`  — total RunTextAnim chunks on screen. More chunks = faster ticks
//            so all animations finish within a similar wall-clock window.
// `delay`  — seconds before this chunk's timeline starts.

export interface RunTextAnimProps {
  /** The character or word displayed in each slot tick. */
  text: string;
  /** How many copies spin through. len=1 → just rises in, no roulette. */
  len?: number;
  /** Total RunTextAnim chunks on screen — used to scale tick speed. */
  total?: number;
  /** Seconds before this chunk starts (after curtainDone). */
  delay?: number;
  /** Split long text into per-character chunks with staggered delays. */
  splitText?: boolean;
  /** Delay added for each next character when splitText is enabled. */
  charStagger?: number;
  /** Extra delay before hover tween starts (used for split-text cascade). */
  hoverDelay?: number;
  /** Optional external hover target (e.g. button) this chunk can react to. */
  hoverTargetRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  style?: React.CSSProperties;
}

export function RunTextAnim({
  text,
  len = 1,
  total = 1,
  delay = 0,
  splitText = true,
  charStagger = 0.04,
  hoverDelay = 0,
  hoverTargetRef,
  className,
  style,
}: RunTextAnimProps) {
  const shouldSplit = splitText && text.length > 1;

  const wrapperRef = useRef<HTMLSpanElement>(null);
  // One ref per copy — populated during render via callback refs
  const copyRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ctxRef = useRef<gsap.Context | null>(null);
  const curtainDone = useUiStore((s) => s.curtainDone);
  const [isTargetHovered, setIsTargetHovered] = useState(false);
  const introDoneRef = useRef(false);

  // Rebuild ref array length when len changes
  useEffect(() => {
    if (shouldSplit) return;
    copyRefs.current = Array.from(
      { length: len },
      (_, i) => copyRefs.current[i] ?? null,
    );
  }, [len, shouldSplit]);

  // Listen to hover state from an external target element (e.g. download button).
  useEffect(() => {
    if (shouldSplit) return;

    const el = hoverTargetRef?.current;
    if (!el) return;

    const handleEnter = () => setIsTargetHovered(true);
    const handleLeave = () => setIsTargetHovered(false);

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [hoverTargetRef, shouldSplit]);

  useEffect(() => {
    if (shouldSplit || !curtainDone) return;
    introDoneRef.current = false;

    ctxRef.current?.revert();

    ctxRef.current = gsap.context(() => {
      const copies = copyRefs.current.filter(Boolean) as HTMLSpanElement[];
      if (copies.length === 0) return;

      const h = (wrapperRef.current?.offsetHeight ?? 60) * 1.2;

      // Base duration for the slowest tick
      const baseDuration = Math.max(0.1, 0.38 / Math.sqrt(total));

      const earlyCount = Math.max(copies.length - 1, 1);

      // Sin ramp — REVERSED: first copy fastest, later copies slower.
      // i=0 → baseDuration*0.25 (fast)  i=n-2 → baseDuration (slow)
      const tickDur = (i: number) => {
        const t = earlyCount === 1 ? 0 : i / (earlyCount - 1);
        return baseDuration * (1 + 0.5 * Math.sin((t * Math.PI) / 2));
      };

      // Park all copies below the clip window — GSAP fully owns transform
      gsap.set(copies, { y: h, opacity: 1 });

      const tl = gsap.timeline({
        delay,
        onComplete: () => {
          introDoneRef.current = true;
        },
      });

      copies.forEach((el, i) => {
        const isLast = i === copies.length - 1;

        if (isLast) {
          // ── Final copy: elastic settle into place ─────────────────────────
          const settleDuration = baseDuration * 1.8;
          tl.to(
            el,
            { y: 0, duration: settleDuration },
            i === 0 ? 0 : `>-=${tickDur(i - 1) * 0.18}`,
          );
        } else {
          const d = tickDur(i);
          const startOverlap = i === 0 ? 0 : `>-=${tickDur(i - 1) * 0.18}`;

          // Single continuous tween h → -h with sine.inOut:
          // accelerates away from bottom, peaks speed at centre (no pause), decelerates to top.
          // This removes the "stop at 0" entirely.
          tl.fromTo(
            el,
            { y: h },
            { y: -h, duration: d, ease: "sine.inOut" },
            startOverlap,
          );
        }
      });
    }, wrapperRef);

    return () => {
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
  }, [curtainDone, text, len, total, delay, shouldSplit]);

  useEffect(() => {
    if (shouldSplit || !curtainDone || !introDoneRef.current) return;
    const baseTween = {
      duration: 0.58,
      delay: hoverDelay,
      overwrite: "auto" as const,
    };

    const copies = copyRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (copies.length === 0) return;

    const finalCopy = copies[copies.length - 1];
    const secondCopy = copies[copies.length - 2];

    gsap.killTweensOf(finalCopy);
    if (secondCopy) gsap.killTweensOf(secondCopy);

    const h = (wrapperRef.current?.offsetHeight ?? 60) * 2.2;

    if (isTargetHovered) {
      gsap.to(finalCopy, {
        y: h,
        scale: 1,
        color: "#111111",
        ease: "sine.out",
        ...baseTween,
      });

      if (secondCopy) {
        gsap.to(secondCopy, {
          y: 0,
          scale: 1,
          color: "#111111",
          ...baseTween,
        });
      }
      return;
    }

    gsap.to(finalCopy, {
      y: 0,
      scale: 1,
      color: "inherit",
      ...baseTween,
    });

    if (secondCopy) {
      gsap.to(secondCopy, {
        y: -h,
        scale: 1,
        color: "#111111",
        ...baseTween,
      });
    }
  }, [isTargetHovered, curtainDone, shouldSplit, hoverDelay]);

  if (shouldSplit) {
    return (
      <span className={className} style={{ display: "inline-flex", ...style }}>
        {Array.from(text).map((char, index) => {
          const glyph = char === " " ? "\u00A0" : char;

          return (
            <RunTextAnim
              key={`${char}-${index}`}
              text={glyph}
              len={len}
              total={total}
              delay={delay + index * charStagger}
              splitText={false}
              hoverDelay={index * charStagger}
              hoverTargetRef={hoverTargetRef}
            />
          );
        })}
      </span>
    );
  }

  return (
    // Outer span: clipping window — must be position:relative + explicit height
    <span
      ref={wrapperRef}
      data-hovered={isTargetHovered ? "true" : "false"}
      className={className}
      style={{
        display: "inline-block",
        position: "relative",
        overflow: "hidden",
        // 1em = exactly one line of text at the current font-size
        height: "1em",
        verticalAlign: "bottom",
        ...style,
      }}
    >
      {/*
        Invisible spacer — takes up the correct width so the wrapper
        doesn't collapse to 0px (all real copies are absolute).
      */}
      <span
        style={{
          visibility: "hidden",
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </span>

      {/* Real copies — all absolute so they're clipped by the wrapper */}
      {Array.from({ length: len }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            copyRefs.current[i] = el;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            // invisible + below frame until GSAP fires on curtainDone
            opacity: 0,
            transform: "translateY(120%)",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </span>
      ))}
    </span>
  );
}
