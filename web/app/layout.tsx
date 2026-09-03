import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#1a1330",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "traceprojector — Finite-element projections for the 3D de Rham complex",
    template: "%s — traceprojector",
  },
  description:
    "Bounded, commuting, discrete-trace preserving projections Π^0..3 for the 3D de Rham complex. Pure-JavaScript, dependency-free, open source.",
  keywords: [
    "finite element method",
    "de Rham complex",
    "Whitney forms",
    "FEM",
    "projection",
    "hodge star",
    "scientific computing",
  ],
  authors: [{ name: "Sachin", url: "https://github.com/sachncs" }],
  creator: "Sachin",
  openGraph: {
    type: "website",
    title: "traceprojector",
    description:
      "Bounded, commuting, discrete-trace preserving projections Π^0..3 for the 3D de Rham complex.",
    siteName: "traceprojector",
  },
  twitter: {
    card: "summary_large_image",
    title: "traceprojector",
    description:
      "Bounded, commuting, discrete-trace preserving projections Π^0..3 for the 3D de Rham complex.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
