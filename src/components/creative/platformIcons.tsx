import type { Platform } from "@/types/creative";

// Inline brand marks for the platform picker. lucide-react dropped brand icons,
// so these are minimal first-party SVGs. `currentColor` is avoided — each keeps
// its brand colour so the dropdown matches Image #2.

interface IconProps {
  size?: number;
  className?: string;
}

export function TikTokIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#000000"
        d="M16.6 5.82a4.28 4.28 0 0 1-1.05-2.82h-3.2v12.86a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.78.12v-3.3a5.88 5.88 0 0 0-.78-.05A5.88 5.88 0 1 0 15.64 16V9.6a7.5 7.5 0 0 0 4.36 1.4V7.8a4.28 4.28 0 0 1-3.4-1.98Z"
      />
    </svg>
  );
}

export function YouTubeIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        fill="#FF0000"
        d="M23.5 6.5a3 3 0 0 0-2.12-2.12C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.38.52A3 3 0 0 0 .5 6.5 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 5.5 3 3 0 0 0 2.12 2.12c1.88.52 9.38.52 9.38.52s7.5 0 9.38-.52A3 3 0 0 0 23.5 17.5 31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-5.5Z"
      />
      <path fill="#FFFFFF" d="M9.6 15.6 15.8 12 9.6 8.4v7.2Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="ig-grad" cx="0.3" cy="1" r="1.1">
          <stop offset="0%" stopColor="#FFD600" />
          <stop offset="40%" stopColor="#FF7A00" />
          <stop offset="70%" stopColor="#FF0069" />
          <stop offset="100%" stopColor="#7638FA" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
      <rect
        x="6.5"
        y="6.5"
        width="11"
        height="11"
        rx="3.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.6"
      />
      <circle cx="17" cy="7" r="1.1" fill="#FFFFFF" />
    </svg>
  );
}

export function PlatformIcon({
  platform,
  size = 18,
  className,
}: IconProps & { platform: Platform }) {
  switch (platform) {
    case "tiktok":
      return <TikTokIcon size={size} className={className} />;
    case "youtube":
      return <YouTubeIcon size={size} className={className} />;
    case "instagram":
      return <InstagramIcon size={size} className={className} />;
  }
}
