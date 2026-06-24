"use client";

import { ReceiptsGallery } from "@/components/ReceiptsGallery";

export default function ReceiptsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold">Receipts</h1>
          <p className="text-gray-400 mt-1">
            Line-item financial record per contestant.
          </p>
        </div>
        <ReceiptsGallery />
      </div>
    </main>
  );
}
