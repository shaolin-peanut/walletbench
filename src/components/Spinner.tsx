"use client";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-indigo-400 ${className}`}
    />
  );
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = [92, 78, 86, 70, 82, 74];

  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 w-full animate-pulse rounded bg-gray-800"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  );
}
