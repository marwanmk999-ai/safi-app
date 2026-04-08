import type { Metadata } from "next";
import { Readex_Pro } from "next/font/google";
import { Geist } from "next/font/google";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const readexPro = Readex_Pro({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Safi | صافي",
  description: "Financial management for freelancers | نظام إدارة مالية للمستقلين",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`dark ${readexPro.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
