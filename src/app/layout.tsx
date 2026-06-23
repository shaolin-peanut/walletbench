import type { Metadata } from "next";
import Link from "next/link";
import NavLinks from "@/components/NavLinks";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalletBench",
  description: "Economic evaluation layer for autonomous agents",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-gray-950">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <header className="border-b border-gray-800 bg-gray-950">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 p-4 text-sm">
            <Link
              href="/"
              className="mr-2 font-bold text-gray-100 transition hover:text-white"
            >
              WalletBench
            </Link>
            <NavLinks />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
