import Link from "next/link";
import { fixtures } from "@/lib/fixtures";
import {
  Trophy,
  Target,
  ListChecks,
  ReceiptText,
  Activity,
  PlayCircle,
} from "lucide-react";

const CARDS = [
  {
    href: "/leaderboard",
    title: "Leaderboard",
    description:
      "Top contestants ranked by total rubric score across task success, ROI, quality, time, policy and auditability.",
    icon: Trophy,
    accent: "from-amber-500/20 to-amber-500/0 border-amber-500/30",
    iconColor: "text-amber-300",
  },
  {
    href: "/challenges",
    title: "Challenges",
    description:
      "Browse the evaluation challenge pack — including the flagship Fund Yourself challenge — with budgets, tools and policies.",
    icon: Target,
    accent: "from-indigo-500/20 to-indigo-500/0 border-indigo-500/30",
    iconColor: "text-indigo-300",
  },
  {
    href: "/runs",
    title: "Runs",
    description:
      "Inspect every contestant run — live and historic — with streaming traces, wallet burn charts and Stripe-test receipts.",
    icon: ListChecks,
    accent: "from-emerald-500/20 to-emerald-500/0 border-emerald-500/30",
    iconColor: "text-emerald-300",
  },
  {
    href: "/trace",
    title: "Trace Timeline",
    description:
      "Streaming per-agent log with deterministic replay — decisions, tool calls, spends, artifacts and policy violations.",
    icon: Activity,
    accent: "from-sky-500/20 to-sky-500/0 border-sky-500/30",
    iconColor: "text-sky-300",
  },
  {
    href: "/receipts",
    title: "Receipts",
    description:
      "Line-item financial record per contestant, sourced from Stripe-test mode receipts and §10 ledger contracts.",
    icon: ReceiptText,
    accent: "from-purple-500/20 to-purple-500/0 border-purple-500/30",
    iconColor: "text-purple-300",
  },
  {
    href: "/demo",
    title: "Demo",
    description:
      "High-contrast restaged screencap mode — leaderboard, trace and receipts on a single page with no debug chrome.",
    icon: PlayCircle,
    accent: "from-rose-500/20 to-rose-500/0 border-rose-500/30",
    iconColor: "text-rose-300",
  },
];

export default function Home() {
  const runCount = fixtures.runs.length;
  const challengeCount = fixtures.challenges.length;
  const contestantCount = fixtures.contestants.length;

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="border-b border-gray-800 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_45%),#030712]">
        <div className="mx-auto max-w-5xl px-4 py-16 md:px-8 md:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            Economic evaluation for autonomous agents
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
            WalletBench
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-300">
            Benchmark how autonomous agents spend money, hold a budget, and
            navigate policy — captured against Stripe-test-mode wallets with
            deterministic replay and rubric scoring.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/leaderboard"
              className="inline-flex items-center rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              View leaderboard
            </Link>
            <Link
              href="/challenges"
              className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
            >
              Browse challenges
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 max-w-md">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Challenges
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {challengeCount}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Runs
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">{runCount}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Contestants
              </dt>
              <dd className="mt-1 text-2xl font-bold text-white">
                {contestantCount}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Navigation cards */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:px-8">
        <h2 className="text-xl font-semibold text-gray-200">
          Explore the bench
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Jump straight into any section of the surface.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${card.accent} bg-gray-900 p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-950/50`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-950/60 ${card.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    {card.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {card.description}
                </p>
                <span className="mt-4 inline-block text-xs font-semibold text-gray-200 transition group-hover:translate-x-0.5">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
