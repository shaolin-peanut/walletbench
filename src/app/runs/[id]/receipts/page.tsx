"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Receipt } from "@/lib/types";

const KIND_STYLES: Record<Receipt["kind"], { bg: string; text: string; symbol: string }> = {
  charge: { bg: "bg-red-50", text: "text-red-700", symbol: "−" },
  payout: { bg: "bg-emerald-50", text: "text-emerald-700", symbol: "+" },
  refund: { bg: "bg-sky-50", text: "text-sky-700", symbol: "↩" },
};

function fmtCents(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function fmtTs(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function truncateRef(ref: string, max = 12) {
  if (ref.length <= max) return ref;
  return `${ref.slice(0, max)}…`;
}

function Badge({ kind }: { kind: Receipt["kind"] }) {
  const style = KIND_STYLES[kind];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
      {style.symbol} {kind}
    </span>
  );
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const { kind, amount_cents, currency, purpose, ts, stripe_ref, balance_after_cents } = receipt;
  const signed = kind === "charge" ? -amount_cents : kind === "payout" ? amount_cents : 0;
  const display = Math.abs(amount_cents);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <Badge kind={kind} />
        <span className={`text-sm font-semibold ${signed < 0 ? "text-red-600" : "text-emerald-600"}`}>
          {signed < 0 ? "−" : "+"}{fmtCents(display, currency)}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-800">{purpose}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <time dateTime={ts}>{fmtTs(ts)}</time>
        <span className="font-mono">{truncateRef(stripe_ref)}</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Balance after: <span className="font-semibold text-gray-700">{fmtCents(balance_after_cents, currency)}</span>
      </div>
    </div>
  );
}

function BurnChart({ receipts }: { receipts: Receipt[] }) {
  const data = useMemo(() => {
    const sorted = [...receipts].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
    return sorted.map((r) => ({
      ts: new Date(r.ts).getTime(),
      label: new Date(r.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      balance_after_cents: r.balance_after_cents,
      kind: r.kind,
      amount_cents: r.amount_cents,
      purpose: r.purpose,
      stripe_ref: r.stripe_ref,
      currency: r.currency,
    }));
  }, [receipts]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Burn Chart</h3>
        <p className="mt-2 text-sm text-gray-500">No receipts to display.</p>
      </div>
    );
  }

  const minY = Math.min(...data.map((d) => d.balance_after_cents));
  const maxY = Math.max(...data.map((d) => d.balance_after_cents));
  const padding = Math.max((maxY - minY) * 0.1, 50);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Burn Chart</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="ts"
              tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[Math.max(0, minY - padding), maxY + padding]}
              tickFormatter={(v) => `${(v / 100).toFixed(0)}`}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number, name: string) => {
                if (name === "balance_after_cents") {
                  return [fmtCents(value, "usd"), "Balance"];
                }
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const d = payload[0].payload as typeof data[0];
                return (
                  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                    <p className="text-xs font-semibold text-gray-900">{d.label}</p>
                    <p className="mt-1 text-xs text-gray-600">Balance: {fmtCents(d.balance_after_cents, d.currency)}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {d.kind}: {fmtCents(d.amount_cents, d.currency)}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{d.purpose}</p>
                    <p className="mt-1 text-xs font-mono text-gray-500">{truncateRef(d.stripe_ref)}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="balance_after_cents"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LedgerTable({ receipts }: { receipts: Receipt[] }) {
  const sorted = useMemo(() => {
    return [...receipts].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
  }, [receipts]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Spend Ledger</h3>
        <p className="mt-2 text-sm text-gray-500">No receipts to display.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Stripe Ref</th>
              <th className="px-4 py-3 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((r) => {
              const signed = r.kind === "charge" ? -r.amount_cents : r.kind === "payout" ? r.amount_cents : 0;
              const display = Math.abs(r.amount_cents);
              return (
                <tr key={`${r.run_id}-${r.ts}-${r.stripe_ref}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                    <time dateTime={r.ts}>{fmtTs(r.ts)}</time>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${KIND_STYLES[r.kind].bg} ${KIND_STYLES[r.kind].text}`}>
                      {KIND_STYLES[r.kind].symbol} {r.kind}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${signed < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {signed < 0 ? "−" : "+"}{fmtCents(display, r.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{r.purpose}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{truncateRef(r.stripe_ref)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {fmtCents(r.balance_after_cents, r.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReceiptsPage({ params }: { params: { id: string } }) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/runs/${encodeURIComponent(params.id)}/receipts`);
        if (res.ok) {
          const data: Receipt[] = await res.json();
          if (!cancelled) {
            setReceipts(data);
          }
        } else {
          throw new Error("Failed to load receipts");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load receipts");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">Loading receipts…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">{error}</div>
        </div>
      </main>
    );
  }

  const sorted = [...receipts].sort(
    (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
  );

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/runs/${params.id}`}
          className="text-sm text-indigo-600 hover:underline"
        >
          ← Back to run
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900 lg:text-4xl">Receipts</h1>
          <p className="mt-1 text-sm text-gray-500">{params.id}</p>
        </div>

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Cards</h2>
          {sorted.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No receipts for this run.</p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sorted.map((r, idx) => (
                <ReceiptCard key={`${r.stripe_ref}-${idx}`} receipt={r} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-8">
          <BurnChart receipts={sorted} />
        </section>

        <section className="mt-8">
          <LedgerTable receipts={sorted} />
        </section>
      </div>
    </main>
  );
}
