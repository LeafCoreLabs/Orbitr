import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Orbitr — Universal Zero-Knowledge Cloud Storage (2 GB Free)",
  description:
    "Universal zero-knowledge personal cloud storage OS with client-side AES-256-GCM encryption, FIDO2 passkeys, burn-after-read shares, drop zones, and 6-digit quick transfers.",
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
  themeColor: "#0b091a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b091a] text-white antialiased selection:bg-purple-500/40 selection:text-white">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
