import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./ClientLayout";
import { constructMetadata, generateStructuredData } from "@/lib/seo";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  ...constructMetadata(),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.jpg", sizes: "any" },
      { url: "/logo.jpg", sizes: "192x192", type: "image/jpeg" },
    ],
    apple: [{ url: "/logo.jpg", sizes: "180x180", type: "image/jpeg" }],
    shortcut: ["/logo.jpg"],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { websiteSchema, softwareAppSchema } = generateStructuredData();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        {/* Schema.org Structured Data (JSON-LD) for Search & AI Engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background font-body-md text-body-md text-on-surface select-none">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
