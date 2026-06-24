"use client";

import { useEffect, useRef, useState } from "react";

type ColorVariant = "default" | "green" | "red" | "amber" | "purple";

interface StatCardProps {
  value: string | number;
  label: string;
  variant?: ColorVariant;
  className?: string;
  formatValue?: boolean;
}

export function StatCard({
  value,
  label,
  variant = "default",
  className = "",
  formatValue = false,
}: StatCardProps) {
  const variantClass = variant !== "default" ? `wb-stat-card--${variant}` : "";
  const formatted = formatValue && typeof value === "number"
    ? value.toLocaleString("en-US")
    : value;

  return (
    <div
      className={`wb-stat-card ${variantClass} ${className}`.trim()}
      role="figure"
      aria-label={`${label}: ${formatted}`}
    >
      <p className="font-display text-display font-bold text-wb-text leading-none tabular-nums">
        {formatted}
      </p>
      <p className="text-label text-wb-muted mt-1.5 font-body uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}
