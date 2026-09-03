import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "traceprojector playground",
  description:
    "Interactive 3D visualisation of bounded, commuting, discrete-trace preserving projections for the 3D de Rham complex.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
