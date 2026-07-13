"use client";

import { useEffect, useRef } from "react";
import { BeaconWrap } from "@/components/landing/testing";
import { Mascot, type MascotHandle } from "@/components/ui/mascot";
import { useUiStore } from "@/hooks/useUiStore";
import { gsap } from "@/lib/gsap";
import { RunTextAnim } from "@/transitions/RunTextAnim";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const downloadButtonRef = useRef<HTMLAnchorElement>(null);
  const organisedRef = useRef<HTMLSpanElement>(null);
  const tonewRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const mascotRef = useRef<MascotHandle>(null);
  const setCustomCursorText = useUiStore((s) => s.setCursorText);
  const setCurtainDone = useUiStore((s) => s.setCurtainDone);

  const handleBeaconHover = (hovering: boolean) => {
    const pillRect = pillRef.current?.getBoundingClientRect();

    const animateRef = (
      el: HTMLSpanElement | null,
      defaultDir: "left" | "right",
    ) => {
      if (!el || !pillRect) return;
      const rect = el.getBoundingClientRect();
      const sameRow = Math.abs(rect.top - pillRect.top) < pillRect.height * 0.5;

      if (sameRow) {
        // Same line — slide horizontally
        gsap.to(el, {
          x: hovering ? (defaultDir === "left" ? -30 : 30) : 0,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      } else {
        // Wrapped above or below — slide vertically
        const above = rect.bottom <= pillRect.top + pillRect.height * 0.5;
        gsap.to(el, {
          y: hovering ? (above ? -30 : 30) : 0,
          x: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    };

    hovering ? mascotRef.current?.wave() : mascotRef.current?.rest();
    animateRef(tonewRef.current, "left");
    animateRef(organisedRef.current, "right");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => setCurtainDone(),
      });

      // Section drops down: clipPath reveals from top → bottom, curve stays throughout
      tl.fromTo(
        sectionRef.current,
        { clipPath: "inset(0 0 100% 0 round 0 0 50% 50% / 0 0 80px 80px)" },
        {
          clipPath: "inset(0 0 0% 0 round 0 0 50% 50% / 0 0 80px 80px)",
          duration: 1.1,
        },
      );

      // Content fades up after section is revealed
      tl.fromTo(
        ".hero-content",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.32 },
        "-=0.4",
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [setCurtainDone]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-125 bg-[#E8F4F0] overflow-hidden h-[80vh]"
      style={{ borderRadius: "0 0 50% 50% / 0 0 80px 80px" }}
    >
      {/* Mascot slides in after section drop (delay matches clipPath duration) */}
      <Mascot ref={mascotRef} delay={0.8} />

      {/* Hero content */}
      <div className="flex flex-col items-center text-center px-6 pt-16 pb-24 max-w-2xl mx-auto gap-5">
        <h1 className="hero-content text-7xl tracking-tight text-gray-900 font-poppins font-bold">
          Welcome to Solvi
        </h1>

        <p className="hero-content mt-10 text-xl text-gray-900 flex flex-wrap items-center justify-center gap-2 font-poppins font-bold">
          <span ref={tonewRef} className="inline-block">
            your new
          </span>
          <span ref={pillRef} className="inline-flex">
            <BeaconWrap
              color="#F5C842"
              rayCount={20}
              gap={10}
              speed={1.5}
              sideWeight={2}
              rotate={-7}
              hoverOnly
              onHoverChange={handleBeaconHover}
            >
              <span className="bg-[#F5C842] text-gray-900 font-bold px-4 py-1.5 rounded-full text-base -rotate-7">
                creative partner
              </span>
            </BeaconWrap>
          </span>

          <span ref={organisedRef} className="inline-block">
            for brainstorming ideas
          </span>
        </p>

        <p className="hero-content mt-5 text-gray-900 max-w-[250px] leading-relaxed font-poppins font-medium">
          Stay you in the age of generated everything
        </p>

        <a
          ref={downloadButtonRef}
          href="/welcome"
          onMouseEnter={() => setCustomCursorText("yes click this")}
          onMouseLeave={() => setCustomCursorText("")}
          className="hero-content mt-8 inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-[#73B7FF] text-black font-semibold text-sm hover:bg-[#9bdcee] transition-colors shadow-md shadow-blue-200"
        >
          <span
            style={{ display: "inline-flex", lineHeight: 1.15 }}
            className="text-2xl font-poppins font-bold text-black"
          >
            {/* <RunTextAnim text="D" delay={0.3} len={3} total={0.41} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="o" delay={0.17} len={2} total={0.13} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="w" delay={1.08} len={3} total={0.22} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="n" delay={0.84} len={2} total={0.24} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="l" delay={0.63} len={2} total={0.44} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="o" delay={1.19} len={2} total={0.13} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="a" delay={1.06} len={2} total={0.23} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="d" delay={1.03} len={3} total={0.41} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} /> */}
            <RunTextAnim
              text="Brainstorm your idea now"
              delay={0.03}
              len={3}
              total={0.41}
              hoverTargetRef={downloadButtonRef}
              style={{ height: "1.25em" }}
            />

            {/* <RunTextAnim text="S" delay={1.23} len={3} total={0.41} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="o" delay={0.17} len={2} total={0.23} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="l" delay={0.63} len={2} total={0.14} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="v" delay={1.01} len={2} total={0.23} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} />
            <RunTextAnim text="i" delay={0.42} len={2} total={0.14} hoverTargetRef={downloadButtonRef} style={{ height: "1.25em" }} /> */}
          </span>
        </a>
      </div>
    </section>
  );
}
