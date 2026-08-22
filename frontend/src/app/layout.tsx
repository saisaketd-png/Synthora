import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/shared/context/ToastContext";
import { MobileBottomNav } from "@/shared/components/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://synthora.com"),
  title: {
    default: "Synthora | Global B2B Chemical Marketplace",
    template: "%s",
  },
  description:
    "Global sourcing for pharmaceutical intermediates, APIs, specialty chemicals, and industrial raw materials with verified supplier documentation.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/icon.svg" }],
  },
  robots: {
    index: true,
    follow: true,
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
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-[#F8FAFC] text-[#1E293B] pb-16 lg:pb-0">
        <ToastProvider>
          {children}
          <MobileBottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
