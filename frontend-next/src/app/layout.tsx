import type { Metadata } from "next";
import { DM_Mono } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import ScrollProgress from "@/components/ScrollProgress";

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
});

export const metadata: Metadata = {
  title: "ScamShield - AI-Powered Job Fraud Detection",
  description: "Protect your career with real-time global telemetry and advanced ML inference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=general-sans@200,300,400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${dmMono.variable} antialiased`} suppressHydrationWarning>
        <SmoothScrolling>
          <ScrollProgress />
          {children}
        </SmoothScrolling>
      </body>
    </html>
  );
}
