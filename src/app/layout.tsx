import type { Metadata } from "next";
import { SiteChrome } from "@/components/SiteChrome";
import "@/fonts/pp-neue-machina.css";
import "@/fonts/ibm-plex-sans-condensed.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ripple",
  description:
    "Wave-driven typographic ASCII — hover to ripple letters out of a 2D wave equation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <SiteChrome />
      </body>
    </html>
  );
}
