import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/shared/context/ToastContext";
import { MobileBottomNav } from "@/shared/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kemkendra.online"),
  title: {
    default: "KemKendra | Global B2B Chemical Marketplace",
    template: "%s",
  },
  description:
    "Global sourcing for pharmaceutical intermediates, APIs, specialty chemicals, and industrial raw materials with verified supplier documentation.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/kemkendra-icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/kemkendra-icon.png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-[#FAFAFA] text-[#0F172A] pb-16 lg:pb-0">
        <ToastProvider>
          {children}
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
