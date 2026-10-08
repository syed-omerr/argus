import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ARGUS — Intelligent Surveillance Operations",
  description:
    "ARGUS is a precision intelligence platform for real-time suspect tracking, CCTV analysis, and multi-camera surveillance coordination.",
  applicationName: "ARGUS",
  keywords: ["surveillance", "intelligence", "CCTV", "suspect tracking", "law enforcement"],
  openGraph: {
    title: "ARGUS — Intelligent Surveillance Operations",
    description:
      "Precision intelligence platform for real-time suspect tracking and CCTV analysis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
