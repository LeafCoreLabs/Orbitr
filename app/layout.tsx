import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Orbitr - Your files, in orbit.",
  description:
    "Security-first personal cloud drive with zero-knowledge encryption, burn-after-read shares, and instant device transfers.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#15171c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#15171c] text-slate-100 antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
