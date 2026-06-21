import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalletBench",
  description: "Economic evaluation layer for autonomous agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
