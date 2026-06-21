export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold tracking-tight">WalletBench</h1>
      <p className="mt-4 text-lg text-neutral-400">
        Agent finance arena — watch wallets compete
      </p>
      <div className="mt-8 grid gap-4 text-sm text-neutral-500">
        <p>Leaderboard → /leaderboard</p>
        <p>Trace timeline → /traces</p>
        <p>Receipts → /receipts</p>
      </div>
    </main>
  );
}
