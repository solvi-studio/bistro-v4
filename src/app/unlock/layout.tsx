import type { Metadata } from "next";

export const metadata: Metadata = { title: "Unlock" };

export default function UnlockLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
