import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WalletBench",
  description: "Economic evaluation layer for autonomous agents",
};

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/trace", label: "Trace" },
  { href: "/receipts", label: "Receipts" },
  { href: "/demo", label: "Demo" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <header className="border-b border-gray-800 bg-gray-950">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 p-4 text-sm">
            <span className="mr-2 font-bold text-gray-100">WalletBench</span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
