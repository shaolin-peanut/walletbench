"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, BadgeDollarSign, CreditCard, ReceiptText, TrendingUp, Wallet } from "lucide-react";
import { fixtures } from "@/lib/fixtures";
import type { Receipt } from "@/lib/types";

function formatCents(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatTime(ts: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function signedAmount(receipt: Receipt): number {
  return receipt.kind === "charge" ? -receipt.amount_cents : receipt.amount_cents;
}

const KIND_STYLES: Record<Receipt["kind"], string> = {
  charge: "border-red-500/30 bg-red-500/10 text-red-200",
  payout: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  refund: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

export default function RunReceiptsPage({ params }: { params: { id: string } }) {
  const run = fixtures.getRun(params.id);

  const model = useMemo(() => {
    if (!run) return null;
    const receipts = fixtures
      .getReceipts(run.id)
      .slice()
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const burnData = [
      {
        label: "Start",
        ts: run.started_at,
        balance: run.wallet.start_cents,
        delta: 0,
        purpose: "Wallet opened",
      },
      ...receipts.map((receipt) => ({
        label: formatTime(receipt.ts),
        ts: receipt.ts,
        balance: receipt.balance_after_cents,
        delta: signedAmount(receipt),
        purpose: receipt.purpose,
      })),
    ];

    const totalCharges = receipts
      .filter((receipt) => receipt.kind === "charge")
      .reduce((sum, receipt) => sum + receipt.amount_cents, 0);
    const totalCredits = receipts
      .filter((receipt) => receipt.kind !== "charge")
      .reduce((sum, receipt) => sum + receipt.amount_cents, 0);
    const netDelta = receipts.reduce((sum, receipt) => sum + signedAmount(receipt), 0);
    const finalBalance = receipts.at(-1)?.balance_after_cents ?? run.wallet.balance_cents;
    const contestant = fixtures.contestants.find((c) => c.id === run.contestant_id);
    const challenge = fixtures.challenges.find((c) => c.id === run.challenge_id);

    return { receipts, burnData, totalCharges, totalCredits, netDelta, finalBalance, contestant, challenge };
  }, [run]);

  if (!run || !model) {
    return (
      <main className="min-h-screen bg-gray-950 p-6 text-gray-100">
        <div className="mx-auto max-w-4xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <p className="text-lg font-semibold text-red-200">Run not found</p>
          <Link href="/leaderboard" className="mt-4 inline-flex text-sm text-red-100 underline">
            Return to leaderboard
          </Link>
        </div>
      </main>
    );
  }

  const currency = run.wallet.currency;

  return (
    <main className="min-h-screen bg-gray-950 p-4 text-gray-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-800 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_34%),#111827] p-6 shadow-2xl md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href={`/runs/${run.id}`}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to trace
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-300">
              <span>Run receipts</span>
              <span className="rounded-full border border-emerald-400/30 px-2 py-1 tracking-normal text-emerald-100">
                {run.live ? "live wallet" : "replay wallet"}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
              {model.challenge?.title ?? run.challenge_id}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
              Ledger and Stripe-test receipt trail for {model.contestant?.name ?? run.contestant_id} on {run.id}.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-emerald-200">Wallet balance</div>
            <div className="mt-1 text-3xl font-black text-emerald-100">
              {formatCents(model.finalBalance, currency)}
            </div>
            <div className="text-xs text-emerald-200/80">
              Start {formatCents(run.wallet.start_cents, currency)} · Net {model.netDelta >= 0 ? "+" : ""}
              {formatCents(model.netDelta, currency)}
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/80 p-5">
            <Wallet className="mb-3 h-5 w-5 text-gray-400" />
            <div className="text-xs uppercase tracking-wide text-gray-500">Starting budget</div>
            <div className="mt-1 text-2xl font-bold text-white">{formatCents(run.wallet.start_cents, currency)}</div>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <CreditCard className="mb-3 h-5 w-5 text-red-300" />
            <div className="text-xs uppercase tracking-wide text-red-200/80">Charges</div>
            <div className="mt-1 text-2xl font-bold text-red-100">{formatCents(model.totalCharges, currency)}</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <BadgeDollarSign className="mb-3 h-5 w-5 text-emerald-300" />
            <div className="text-xs uppercase tracking-wide text-emerald-200/80">Payouts / refunds</div>
            <div className="mt-1 text-2xl font-bold text-emerald-100">{formatCents(model.totalCredits, currency)}</div>
          </div>
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5">
            <ReceiptText className="mb-3 h-5 w-5 text-indigo-300" />
            <div className="text-xs uppercase tracking-wide text-indigo-200/80">Receipts</div>
            <div className="mt-1 text-2xl font-bold text-indigo-100">{model.receipts.length}</div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-800 bg-gray-900/80 p-5 shadow-xl">
          <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                <TrendingUp className="h-5 w-5 text-emerald-300" /> Burn chart
              </h2>
              <p className="text-sm text-gray-400">Running wallet balance after each Stripe-test transaction.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-gray-500">Recharts</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.burnData} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="walletBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.55} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis
                  stroke="#9ca3af"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) => `$${Number(value / 100).toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{ background: "#020617", border: "1px solid #374151", borderRadius: 12 }}
                  labelStyle={{ color: "#d1d5db" }}
                  formatter={(value, name) => [formatCents(Number(value), currency), name === "balance" ? "Balance" : name]}
                />
                <ReferenceLine y={run.wallet.start_cents} stroke="#6366f1" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="balance" stroke="#34d399" strokeWidth={3} fill="url(#walletBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="rounded-3xl border border-gray-800 bg-gray-900/80 p-5">
            <h2 className="mb-4 text-xl font-bold text-white">Receipt cards</h2>
            <div className="space-y-3">
              {model.receipts.map((receipt) => {
                const delta = signedAmount(receipt);
                return (
                  <article key={`${receipt.ts}-${receipt.stripe_ref}`} className={`rounded-2xl border p-4 ${KIND_STYLES[receipt.kind]}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] opacity-70">{receipt.kind}</div>
                        <h3 className="mt-1 font-semibold text-white">{receipt.purpose}</h3>
                      </div>
                      <div className="text-right text-lg font-black">
                        {delta >= 0 ? "+" : "-"}
                        {formatCents(Math.abs(delta), receipt.currency)}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-xs text-gray-300 md:grid-cols-2">
                      <span>{new Date(receipt.ts).toISOString()}</span>
                      <span className="font-mono text-gray-400 md:text-right">{receipt.stripe_ref}</span>
                      <span className="md:col-span-2">Balance after: {formatCents(receipt.balance_after_cents, receipt.currency)}</span>
                    </div>
                  </article>
                );
              })}
              {model.receipts.length === 0 && <p className="text-sm text-gray-500">No receipts recorded for this run.</p>}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900/80">
            <div className="border-b border-gray-800 p-5">
              <h2 className="text-xl font-bold text-white">Ledger running balance</h2>
              <p className="text-sm text-gray-400">Every row is derived from §10 Receipt fields for this run.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-gray-950/70 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Kind</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3 text-right">Delta</th>
                    <th className="px-4 py-3 text-right">Running balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr className="text-gray-300">
                    <td className="px-4 py-3">{formatTime(run.started_at)}</td>
                    <td className="px-4 py-3">open</td>
                    <td className="px-4 py-3">Wallet opened</td>
                    <td className="px-4 py-3 text-right font-mono">—</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{formatCents(run.wallet.start_cents, currency)}</td>
                  </tr>
                  {model.receipts.map((receipt) => {
                    const delta = signedAmount(receipt);
                    return (
                      <tr key={`ledger-${receipt.ts}-${receipt.stripe_ref}`} className="text-gray-300">
                        <td className="px-4 py-3">{formatTime(receipt.ts)}</td>
                        <td className="px-4 py-3 capitalize">{receipt.kind}</td>
                        <td className="px-4 py-3">{receipt.purpose}</td>
                        <td className={`px-4 py-3 text-right font-mono ${delta < 0 ? "text-red-300" : "text-emerald-300"}`}>
                          {delta >= 0 ? "+" : "-"}
                          {formatCents(Math.abs(delta), receipt.currency)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-white">
                          {formatCents(receipt.balance_after_cents, receipt.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
