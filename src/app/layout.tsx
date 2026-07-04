import type { Metadata } from "next";
import { DM_Serif_Display, Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { getClerkProxyConfig } from "@/lib/clerk-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Solvi",
    template: "%s · Solvi",
  },
  description: "Your creative companion for content creation.",
  applicationName: "Solvi",
  openGraph: {
    type: "website",
    siteName: "Solvi",
    title: "Solvi",
    description: "Your creative companion for content creation.",
    images: [{ url: "/icon.png", width: 456, height: 412, alt: "Solvi" }],
  },
  twitter: {
    card: "summary",
    title: "Solvi",
    description: "Your creative companion for content creation.",
    images: ["/icon.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkConfig = await getClerkProxyConfig();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${dmSerifDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider {...clerkConfig}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
