import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const satoshi = localFont({
  src: "../fonts/Satoshi-Medium.woff2",
  variable: "--font-satoshi",
  weight: "500",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Home",
  description: "Portfolio — scroll through projects with snap and timed advance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${satoshi.variable} h-full antialiased`}>
      <body className="min-h-full font-sans font-medium">{children}</body>
    </html>
  );
}
