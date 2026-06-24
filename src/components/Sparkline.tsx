"use client";

import { useMemo } from "react";

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
};

export function Sparkline({
  data,
  width = 88,
  height = 28,
  stroke = "#6366f1",
  fill = "rgba(99,102,241,0.15)",
  className = "",
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) {
      if (data.length === 1) {
        const y = height / 2;
        const line = `M0,${y} L${width},${y}`;
        return { line, area: "" };
      }
      const line = `M0,${height / 2} L${width},${height / 2}`;
      return { line, area: "" };
    }
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return [x, y] as const;
    });

    const line = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

    const area = `${line} L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [data, width, height]);

  const last = data[data.length - 1];
  const prev = data[data.length - 2] ?? last;
  const up = last >= prev;
  const dynamicStroke = up ? stroke : "#ef4444";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
      aria-hidden="true"
    >
      <path d={path.area} fill={fill} />
      <path d={path.line} fill="none" stroke={dynamicStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
