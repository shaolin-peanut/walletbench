import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-6xl font-black text-indigo-400">404</h1>
        <p className="mt-4 text-lg text-gray-300">
          This route isn&apos;t part of the arena.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          The challenge spec may have changed, or the link you followed is no longer valid.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            Back to home
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex items-center rounded-lg border border-gray-700 bg-gray-900 px-5 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:bg-gray-800"
          >
            View leaderboard
          </Link>
        </div>
      </div>
    </main>
  );
}
