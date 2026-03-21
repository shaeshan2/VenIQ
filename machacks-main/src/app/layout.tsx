import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

/** Clean, readable UI font (replaces Geist for session-first UX) */
const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VenIQ",
  description: "Crowd-aware AI DJ that reads the room and adapts the music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full bg-black">
        <Providers>
          <AppLayout>{children}</AppLayout>
          <Toaster position="top-right" theme="dark" />
        </Providers>
      </body>
    </html>
  );
}
