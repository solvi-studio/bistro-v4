"use client";

import { gsap } from "gsap";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getInitialOnboardingData,
  LANE_OPTIONS,
  markOnboardingDone,
  saveOnboardingData,
} from "@/utils/onboarding";
import BackgroundCanvas from "./t3-empty/backgroundCanvas";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Screen = "name" | "content" | "character" | "pain" | "loading" | "summary";

const CHARACTERS = [
  { label: "The Chef", bg: "#fef3e2", ref: "chef" },
  { label: "The Scholar", bg: "#e8f4fd", ref: "scholar" },
  { label: "The Explorer", bg: "#e8f8f0", ref: "explorer" },
  { label: "The Creator", bg: "#fde8f0", ref: "creator" },
  { label: "The Traveler", bg: "#f3e8fd", ref: "traveler" },
];

const LOADING_PHASES = [
  { pct: 25, msg: "Alright...I've got a starting point!" },
  { pct: 50, msg: "We'll figure the rest out together as you go" },
  { pct: 80, msg: "First, let's confirm some deets about you..." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small shared pieces
// ─────────────────────────────────────────────────────────────────────────────

function Blob({ color, className }: { color: string; className: string }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(48px)",
        opacity: 0.6,
      }}
    />
  );
}

function MascotAvatar({ size = 64, src }: { size?: number; src?: string }) {
  return (
    <div className="flex justify-center mb-6">
      <Image
        src={src ?? "/icon/mascot.png"}
        alt="Solvi"
        className="rounded-full object-cover"
        width={size}
        height={size}
      />
    </div>
  );
}

function Cta({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 mt-8">
      <span
        className={`text-[15px] font-semibold ${disabled ? "text-[#ccc]" : "text-[#1a1a1a]"}`}
      >
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-10 h-10 rounded-full bg-[#3b7cf4] flex items-center justify-center text-white text-[20px] font-semibold shadow-md transition-all hover:bg-[#2f67dc] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        →
      </button>
    </div>
  );
}

function BackCta({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      data-enter-skip="true"
      onClick={onClick}
      className="rounded-full border border-[#c4d3ea] bg-white/95 px-5 py-2.5 text-[14px] font-semibold text-[#40526e] shadow-sm transition-all hover:bg-[#f3f7ff]"
    >
      ← Go back
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LoadingScreen — own component so useEffect([]) fires after its own mount
// ─────────────────────────────────────────────────────────────────────────────

function LoadingScreen({
  onDone,
  avatarSrc,
}: {
  onDone: () => void;
  avatarSrc?: string;
}) {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const phase = LOADING_PHASES[phaseIdx];

  // Animate the bar segment for the current phase, then advance
  useEffect(() => {
    if (!barRef.current) return;

    const targetPct = `${phase.pct}%`;
    const tween = gsap.to(barRef.current, {
      width: targetPct,
      duration: 0.5,
      // duration: 2,
      ease: "power2.out",
      onComplete: () => {
        setTimeout(() => {
          if (phaseIdx < LOADING_PHASES.length - 1) {
            setPhaseIdx((i) => i + 1);
          } else {
            onDone();
          }
        }, 600);
      },
    });

    return () => {
      tween.kill();
    };
  }, [onDone, phase.pct, phaseIdx]); // re-runs each time phase changes

  return (
    <div className="relative w-full max-w-160 px-8 flex flex-col items-center text-center">
      <Blob color="#f5d88a" className="w-60 h-60 -bottom-20 -left-20" />
      <Blob color="#93c5fd" className="w-50 h-50 -top-15 -right-15" />
      <div className="relative flex flex-col items-center">
        <MascotAvatar size={130} src={avatarSrc} />
        <p className="text-[15px] text-[#bbb] mb-4 font-semibold tracking-wide">
          {phase.pct}%
        </p>
        <p className="text-[24px] font-semibold text-[#1a1a1a] leading-[1.35] mb-2 max-w-160">
          {phase.msg}
        </p>
        <p className="text-[14px] text-[#aaa]">Building your space</p>
      </div>
      <div className="mt-8 h-[5px] w-full overflow-hidden rounded-full bg-[#eee]">
        <div
          ref={barRef}
          className="h-full rounded-full bg-[#3b7cf4]"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main OnboardingFlow
// ─────────────────────────────────────────────────────────────────────────────

type Props = { onComplete: () => void };

export default function OnboardingFlow({ onComplete }: Props) {
  const saved = getInitialOnboardingData();
  const [screen, setScreen] = useState<Screen>("name");
  const [name, setName] = useState(saved.name || "");
  const [contentTypes, setContentTypes] = useState<string[]>(
    saved.dataLane ?? [],
  );
  const [character, setCharacter] = useState<number | null>(null);
  const [painPoints, setPainPoints] = useState(saved.challenge || "");
  const [othersExpanded, setOthersExpanded] = useState(false);
  const [othersText, setOthersText] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate card in on every screen change (except loading — it has its own component)
  useEffect(() => {
    if (screen === "loading") return;
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.42, ease: "power2.out" },
    );
  }, [screen]);

  const advance = useCallback((from: Screen) => {
    const order: Screen[] = [
      "name",
      "content",
      "character",
      "pain",
      "loading",
      "summary",
    ];
    const next = order[order.indexOf(from) + 1];
    if (next) setScreen(next);
  }, []);

  const retreat = useCallback((from: Screen) => {
    const previous: Partial<Record<Screen, Screen>> = {
      content: "name",
      character: "content",
      pain: "character",
      summary: "pain",
    };
    const prior = previous[from];
    if (prior) setScreen(prior);
  }, []);

  const characterSrc =
    character !== null ? `/icon/${CHARACTERS[character].ref}.png` : undefined;

  useEffect(() => {
    if (character === null) return;
    const current = getInitialOnboardingData();
    saveOnboardingData({ ...current, character: CHARACTERS[character].ref });
  }, [character]);

  const handleFinish = useCallback(() => {
    const characterRef =
      character !== null ? CHARACTERS[character].ref : undefined;
    markOnboardingDone({
      name,
      dataLane: contentTypes,
      challenge: painPoints,
      character: characterRef,
    });
    onComplete();
  }, [character, contentTypes, name, onComplete, painPoints]);

  useEffect(() => {
    const handleEnterKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      if (
        event.defaultPrevented ||
        event.isComposing ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-enter-skip="true"]')
      ) {
        return;
      }

      let handled = false;

      switch (screen) {
        case "name":
          if (name.trim()) {
            advance("name");
            handled = true;
          }
          break;
        case "content":
          if (contentTypes.length > 0) {
            advance("content");
            handled = true;
          }
          break;
        case "character":
          if (character !== null) {
            advance("character");
            handled = true;
          }
          break;
        case "pain":
          if (painPoints.trim()) {
            advance("pain");
            handled = true;
          }
          break;
        case "summary":
          handleFinish();
          handled = true;
          break;
        default:
          break;
      }

      if (handled) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleEnterKeyDown);

    return () => {
      window.removeEventListener("keydown", handleEnterKeyDown);
    };
  }, [
    advance,
    character,
    contentTypes,
    handleFinish,
    name,
    painPoints,
    screen,
  ]);

  const canGoBack =
    screen === "content" ||
    screen === "character" ||
    screen === "pain" ||
    screen === "summary";

  const painChips = ["ideas", "creative fatigue", "content management"];
  const toggleChip = (chip: string) => {
    setPainPoints((prev) => {
      const parts = prev
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.includes(chip))
        return parts.filter((p) => p !== chip).join(", ");
      return [...parts, chip].join(", ");
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-white font-poppins flex items-center justify-center overflow-hidden font-semibold">
      <BackgroundCanvas />
      {/* ── 1: Name ─────────────────────────────────────────────────────── */}
      {screen === "name" && (
        <>
          <div ref={cardRef} className="relative w-full max-w-3xl">
            <Blob color="#f8a5a5" className="w-65 h-65 -bottom-16 -left-20" />
            <Blob color="#a8f0c0" className="w-50 h-50 -top-10 -right-10" />
            <div className="relative flex flex-col items-center">
              <MascotAvatar size={72} />
              <p className="text-[26px] text-[#1a1a1a] leading-[1.45] text-center">
                Before we build your creative playground together, I
              </p>
              <p className="text-[26px] text-[#1a1a1a] text-center mb-6">
                need to get a feel for your brain. Let's build this together!
              </p>

              <p className="text-[26px] text-[#1a1a1a] text-center mb-10">
                First, I want to get to know you. What should I call you?
              </p>
              <input
                className="w-11/12 rounded-full bg-[#eef0f6] px-6 py-4 text-[17px] font-semibold text-[#1a1a1a] outline-none placeholder:text-[#aaa]"
                placeholder="real name, alias, alter ego – all valid"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="fixed bottom-5 right-5 z-[100000]">
            <Cta
              label="Lock it in"
              onClick={() => advance("name")}
              disabled={!name.trim()}
            />
          </div>
        </>
      )}

      {/* ── 2: Content type ─────────────────────────────────────────────── */}
      {screen === "content" && (
        <>
          <div ref={cardRef} className="relative w-full max-w-180 px-8">
            <Blob color="#f5d88a" className="w-55 h-55 -bottom-10 -left-16" />
            <Blob color="#93c5fd" className="w-50 h-50 -top-8 -right-8" />
            <div className="relative">
              <MascotAvatar size={72} />
              <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-7 leading-[1.45]">
                Hey {name}!<br />
                What kind of <em>things</em> do you create and bring to life?
              </p>
              <div className="flex flex-col gap-3 items-center">
                {LANE_OPTIONS.filter((opt) => opt !== "Others").map((opt) => {
                  const LANE_EMOJIS: Record<string, string> = {
                    "Educational bites": "📚",
                    "Short-form cheap eats": "🍔",
                    "Travel Tips": "✈️",
                  };
                  const selected = contentTypes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setContentTypes((prev) =>
                          prev.includes(opt)
                            ? prev.filter((t) => t !== opt)
                            : [...prev, opt],
                        )
                      }
                      className={`w-11/12 rounded-full px-6 py-4 text-[17px] text-left transition-all border flex items-center justify-between ${
                        selected
                          ? "bg-[#dce8fb] border-[#1363f8] text-[#0f172a] font-semibold"
                          : "bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7]"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span>{LANE_EMOJIS[opt]}</span>
                        <span>{opt}</span>
                      </span>
                      {selected && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#3b7cf4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>Selected</title>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}

                {/* Others — expands to text input when clicked */}
                {othersExpanded ? (
                  <div className="w-11/12 flex flex-col">
                    <input
                      className="w-full rounded-full bg-[#dce8fb] border border-[#1363f8] px-6 py-4 text-[17px] text-[#0f172a] outline-none placeholder:text-[#9bafc8]"
                      placeholder="e.g. cooking, fitness, gaming"
                      value={othersText}
                      onChange={(e) => {
                        setOthersText(e.target.value);
                        setContentTypes((prev) => {
                          const withoutOthers = prev.filter(
                            (t) => !t.startsWith("Others:") && t !== "Others",
                          );
                          const parts = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          return parts.length > 0
                            ? [
                                ...withoutOthers,
                                ...parts.map((p) => `Others: ${p}`),
                              ]
                            : withoutOthers;
                        });
                      }}
                    />
                    <p className="text-[12px] text-[#9bafc8] mt-1.5 pl-4">
                      Separate multiple with commas
                    </p>
                    {othersText
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 pl-2">
                        {othersText
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .map((p) => (
                            <span
                              key={p}
                              className="rounded-full bg-white/70 px-3 py-1 text-[13px] text-[#52596b] font-semibold border border-[#c2d6f4]"
                            >
                              #Others: {p}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOthersExpanded(true)}
                    className="w-11/12 rounded-full px-6 py-4 text-[17px] text-left transition-all border bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7] flex items-center gap-3"
                  >
                    <span>•••</span>
                    <span>Others</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="fixed bottom-5 right-5 z-[100000]">
            <Cta
              label="Yes, that's my lane"
              onClick={() => advance("content")}
              disabled={contentTypes.length === 0}
            />
          </div>
        </>
      )}

      {/* ── 3: Character ────────────────────────────────────────────────── */}
      {screen === "character" && (
        <>
          <div ref={cardRef} className="relative w-full max-w-150 px-8">
            <Blob color="#fbb6ce" className="w-50 h-50 -top-8 -left-12" />
            <Blob color="#93c5fd" className="w-50 h-50 -bottom-8 -right-8" />
            <div className="relative">
              <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-8 leading-[1.45]">
                Now pick your own character that represents <em>you</em> the
                most...
              </p>
              <div className="grid grid-cols-3 space-x-6 mb-4">
                {CHARACTERS.slice(0, 3).map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCharacter(i)}
                    className={`relative flex flex-col items-center p-3 rounded-[18px] transition-all border-2 ${
                      character === i
                        ? "border-[#3b7cf4] bg-[#dce8fb]/40"
                        : "border-transparent"
                    }`}
                    // style={{ background: character === i ? '#dce8fb' : c.bg }}
                  >
                    {character === i && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#3b7cf4] text-white flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>Selected</title>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    <div className="w-35 h-35 rounded-full overflow-hidden">
                      <Image
                        src={`/icon/${c.ref}.png`}
                        alt={c.ref}
                        className="h-full w-full object-cover"
                        width={140}
                        height={140}
                      />
                    </div>
                    {/* <span className="text-[11px] font-semibold text-[#52596b]">{c.label}</span> */}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 px-10">
                {CHARACTERS.slice(3).map((c, i) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setCharacter(i + 3)}
                    className={`relative flex flex-col items-center gap-2 p-3 rounded-[18px] transition-all border-2 ${
                      character === i + 3
                        ? "border-[#3b7cf4] bg-[#dce8fb]/40"
                        : "border-transparent"
                    }`}
                    // style={{ background: character === i + 3 ? '#dce8fb' : c.bg }}
                  >
                    {character === i + 3 && (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#3b7cf4] text-white flex items-center justify-center">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <title>Selected</title>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    <div className="w-32 h-32 rounded-full overflow-hidden">
                      <Image
                        src={`/icon/${c.ref}.png`}
                        alt={c.ref}
                        className="h-full w-full object-cover"
                        width={128}
                        height={128}
                      />
                    </div>
                    {/* <span className="text-[11px] font-semibold text-[#52596b]">{c.label}</span> */}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="fixed bottom-5 right-5 z-[100000]">
            <Cta
              label="This is so me, let's go!"
              onClick={() => advance("character")}
              disabled={character === null}
            />
          </div>
        </>
      )}

      {/* ── 4: Pain points ──────────────────────────────────────────────── */}
      {screen === "pain" && (
        <>
          <div ref={cardRef} className="relative w-full max-w-180 px-8">
            <Blob color="#fca5a5" className="w-55 h-55 -top-8 -left-12" />
            <Blob color="#86efac" className="w-50 h-50 -bottom-8 -right-8" />
            <div className="relative">
              <MascotAvatar size={130} src={characterSrc} />
              <p className="mb-2 text-center text-[26px] leading-[1.45] font-semibold text-[#1a1a1a]">
                Got it!
              </p>
              <p className="text-[26px] font-semibold text-[#1a1a1a] text-center mb-6 leading-normal">
                Now, when it comes to creating content...what's been slowing you
                down lately?
              </p>
              <input
                className="w-full rounded-full bg-[#eef0f6] px-6 py-4 text-[17px] text-[#1a1a1a] outline-none placeholder:text-[#aaa] mb-4"
                placeholder="ideas, consistency, overthinking… whatever it is"
                value={painPoints}
                onChange={(e) => setPainPoints(e.target.value)}
              />
              <div className="flex flex-wrap justify-center gap-4">
                {painChips.map((chip) => {
                  const CHIP_EMOJIS: Record<string, string> = {
                    ideas: "🖼️",
                    "creative fatigue": "😤",
                    "content management": "📊",
                  };
                  const active = painPoints
                    .split(",")
                    .map((s) => s.trim())
                    .includes(chip);
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`rounded-full px-5 py-2 text-[15px] transition-all border flex items-center gap-2 ${
                        active
                          ? "bg-[#dce8fb] border-[#3b7cf4] text-[#0f172a] font-semibold"
                          : "bg-[#eef2f9] border-transparent text-[#52596b] hover:bg-[#e4ecf7]"
                      }`}
                    >
                      <span>{CHIP_EMOJIS[chip]}</span>
                      <span>{chip}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="fixed bottom-5 right-5 z-[100000]">
            <Cta
              label="This feels right!"
              onClick={() => advance("pain")}
              disabled={!painPoints.trim()}
            />
          </div>
        </>
      )}

      {/* ── 5: Loading (own component — guaranteed ref on mount) ─────────── */}
      {screen === "loading" && (
        <LoadingScreen
          onDone={() => setScreen("summary")}
          avatarSrc={characterSrc}
        />
      )}

      {/* ── 6: Summary ──────────────────────────────────────────────────── */}
      {screen === "summary" && (
        <div
          ref={cardRef}
          className="relative w-full max-w-2xl px-8 flex flex-col items-center"
        >
          <Blob color="#fca5a5" className="w-50 h-50 -bottom-15 -left-15" />
          <Blob color="#86efac" className="w-50 h-50 -bottom-10 -right-10" />
          <div className="relative w-full flex flex-col items-center">
            {/* Checkmark */}
            <div className="flex justify-center mb-5">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Completed</title>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-[32px] font-semibold text-[#1a1a1a] text-center mb-8 leading-tight">
              Here's what I'm setting up for you
            </h2>

            {/* Card */}
            <div className="w-full rounded-[24px] bg-[#dce8fb] px-7 py-6 text-left mb-8">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-5">
                <Image
                  src={characterSrc ?? "/icon/mascot.png"}
                  alt="avatar"
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                  width={56}
                  height={56}
                />
                <span className="text-[26px] font-semibold text-[#0f172a]">
                  {name || "You"}
                </span>
              </div>

              {/* Content lane */}
              <div className="mb-4">
                <p className="text-[15px] font-semibold text-[#0f172a] mb-2">
                  Your Content Lane
                </p>
                <div className="flex flex-wrap gap-2">
                  {contentTypes.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/70 px-4 py-1.5 text-[14px] text-[#52596b] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pain points */}
              {painPoints.trim() && (
                <div>
                  <p className="text-[15px] font-semibold text-[#0f172a] mb-2">
                    What's been holding you back
                  </p>
                  <div className="rounded-[14px] bg-white/60 px-5 py-4">
                    <ul className="space-y-1.5">
                      {painPoints
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((p) => (
                          <li
                            key={p}
                            className="text-[14px] text-[#52596b] leading-[1.6]"
                          >
                            • {p}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              <p className="mt-5 text-[13px] !font-light italic text-black leading-normal text-center">
                Does this feel right? Let's start working together to unravel
                these frictions
              </p>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleFinish}
              className="rounded-[18px] bg-[#22c55e] hover:bg-[#16a34a] text-white font-semibold text-[22px] px-4 py-4 transition-colors shadow-md"
            >
              Start collecting ideas
            </button>
          </div>
        </div>
      )}
      {canGoBack && (
        <div className="fixed bottom-5 left-5 z-[100000]">
          <BackCta onClick={() => retreat(screen)} />
        </div>
      )}
      {/* CTA is now handled per step above for all steps */}
    </div>
  );
}
