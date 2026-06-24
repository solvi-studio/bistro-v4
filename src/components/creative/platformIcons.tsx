import { FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa6";
import type { Platform } from "@/types/creative";

interface IconProps {
  size?: number;
  className?: string;
}

export function TikTokIcon({ size = 18, className }: IconProps) {
  return <FaTiktok size={size} className={className} />;
}

export function YouTubeIcon({ size = 18, className }: IconProps) {
  return (
    <FaYoutube size={size} className={`text-[#FF0000] ${className ?? ""}`} />
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <FaInstagram size={size} className={`text-[#E1306C] ${className ?? ""}`} />
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
