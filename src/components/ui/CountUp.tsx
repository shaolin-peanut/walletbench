"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  autoPlay?: boolean;
  durationMs?: number;
}

export function CountUp({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
  autoPlay = true,
  durationMs = 900,
}: CountUpProps) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (!autoPlay) return;

    const start = prevValue.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.005) {
      setDisplayed(value);
      prevValue.current = value;
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplayed(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayed(value);
        prevValue.current = value;
      }
    }

    requestAnimationFrame(tick);
  }, [value, autoPlay, durationMs]);

  return (
    <span className={`tabular-nums font-display ${className}`.trim()}>
      {prefix}
      {displayed.toFixed(decimals)}
      {suffix}
    </span>
  );
}
