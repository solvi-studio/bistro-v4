"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { gsap } from "@/lib/gsap";

const REST_X = 30;

interface MascotProps {
  delay?: number;
}

export interface MascotHandle {
  wave: () => void;
  rest: () => void;
}

export const Mascot = forwardRef<MascotHandle, MascotProps>(function Mascot(
  { delay = 0 },
  ref,
) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const waveTlRef = useRef<gsap.core.Timeline | null>(null);

  useImperativeHandle(ref, () => ({
    wave() {
      if (waveTlRef.current) return;
      const hand = handRef.current;
      if (!hand) return;

      // Set rotation origin to bottom-left (wrist pivot)
      gsap.set(hand, { transformOrigin: "20% 90%" });

      const tl = gsap.timeline({ repeat: -1 });

      // Float up smoothly first
      tl.to(hand, { x: REST_X + 6, y: -18, duration: 0.35, ease: "sine.out" })
        // Rock back and forth — yoyo gives the return stroke for free
        .to(hand, { rotation: -20, duration: 0.28, ease: "sine.inOut" })
        .to(hand, { rotation: 14, duration: 0.28, ease: "sine.inOut" })
        .to(hand, { rotation: -16, duration: 0.26, ease: "sine.inOut" })
        .to(hand, { rotation: 10, duration: 0.26, ease: "sine.inOut" })
        .to(hand, { rotation: -8, duration: 0.3, ease: "sine.inOut" })
        // Brief pause at neutral before looping
        .to(hand, {
          x: REST_X,
          y: 0,
          rotation: 0,
          duration: 0.35,
          ease: "sine.inOut",
        });

      waveTlRef.current = tl;
    },
    rest() {
      waveTlRef.current?.kill();
      waveTlRef.current = null;
      gsap.to(handRef.current, {
        x: REST_X,
        y: 0,
        rotation: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    },
  }));

  useEffect(() => {
    const ctx = gsap.context(() => {
      const shared = { duration: 0.6, ease: "back.out(1.2)" };

      // Each part has its own `to` x value — change these independently
      gsap.fromTo(
        bodyRef.current,
        { x: -120, y: 50, opacity: 0 },
        { x: -10, y: -30, opacity: 1, ...shared, delay: delay },
      );
      gsap.fromTo(
        frameRef.current,
        { x: -120, opacity: 0 },
        { x: 0, opacity: 1, ...shared, delay: delay },
      );
      gsap.fromTo(
        faceRef.current,
        { x: -120, opacity: 0 },
        { x: -10, y: -50, opacity: 1, ...shared, delay: delay },
      );
      gsap.fromTo(
        handRef.current,
        { x: -120, opacity: 0 },
        { x: 30, opacity: 1, ...shared, delay: delay + 0.3 },
      );
    });
    return () => {
      ctx.revert();
      waveTlRef.current?.kill();
    };
  }, [delay]);

  return (
    <div className="absolute left-0 bottom-0 w-52 h-[340px] pointer-events-none select-none">
      {/* frame (yellow) — back layer */}
      <div
        ref={frameRef}
        className="absolute bottom-0 left-0"
        style={{ opacity: 0 }}
      >
        <Image
          src="/frame.png"
          alt=""
          width={130}
          height={204}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
        />
      </div>

      {/* body (green) — mid layer */}
      <div
        ref={bodyRef}
        className="absolute bottom-0 left-2"
        style={{ opacity: 0 }}
      >
        <Image
          src="/body.png"
          alt=""
          width={150}
          height={313}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
        />
      </div>

      {/* face — on upper body */}
      <div
        ref={faceRef}
        className="absolute top-16 left-8"
        style={{ opacity: 0 }}
      >
        <Image
          src="/face.png"
          alt=""
          width={80}
          height={68}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
        />
      </div>

      {/* hand — sticking out to the right */}
      <div
        ref={handRef}
        className="mascot-hand absolute bottom-24 right-0"
        style={{ opacity: 0 }}
      >
        <Image
          src="/hand.png"
          alt=""
          width={100}
          height={66}
          style={{ width: "auto", height: "auto" }}
          className="object-contain"
        />
      </div>
    </div>
  );
});
