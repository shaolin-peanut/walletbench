import type { TraceEvent, Receipt, Run } from "./types";
import { fixtures } from "./fixtures";

export interface ReplayCallbacks {
  onTrace(event: TraceEvent): void;
  onReceipt(receipt: Receipt): void;
  onRunUpdate?(run: Run): void;
  onDone(): void;
}

export interface ReplayController {
  pause(): void;
  resume(): void;
  setSpeed(n: number): void;
  stop(): void;
}

type TimelineItem =
  | { kind: "trace"; ts: number; payload: TraceEvent }
  | { kind: "receipt"; ts: number; payload: Receipt };

function buildTimeline(traceEvents: TraceEvent[], receipts: Receipt[]): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const ev of traceEvents) {
    items.push({ kind: "trace", ts: new Date(ev.ts).getTime(), payload: ev });
  }

  for (const r of receipts) {
    items.push({ kind: "receipt", ts: new Date(r.ts).getTime(), payload: r });
  }

  items.sort((a, b) => {
    if (a.ts !== b.ts) return a.ts - b.ts;
    if (a.kind === b.kind) {
      if (a.kind === "trace") {
        return a.payload.seq - (b as { kind: "trace"; payload: TraceEvent }).payload.seq;
      }
      return 0;
    }
    return a.kind === "trace" ? -1 : 1;
  });

  return items;
}

export function startReplay(
  runId: string,
  traceEvents: TraceEvent[],
  receipts: Receipt[],
  callbacks: ReplayCallbacks,
  options?: { speed?: number; paused?: boolean }
): ReplayController {
  const timeline = buildTimeline(traceEvents, receipts);
  const baseTs = timeline.length > 0 ? timeline[0].ts : 0;

  let speed = options?.speed ?? 1;
  let paused = options?.paused ?? false;
  let stopped = false;
  let index = 0;
  let nextTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSimulatedTime = 0;

  function emit(item: TimelineItem) {
    if (item.kind === "trace") {
      callbacks.onTrace(item.payload);
    } else {
      callbacks.onReceipt(item.payload);
    }
  }

  function tick() {
    if (stopped || paused || index >= timeline.length) return;

    const item = timeline[index];
    const itemSimulatedTime = item.ts - baseTs;
    const delayMs = (itemSimulatedTime - lastSimulatedTime) / speed;

    nextTimeoutId = setTimeout(() => {
      if (stopped) return;

      emit(item);
      index++;
      lastSimulatedTime = itemSimulatedTime;

      if (index >= timeline.length) {
        callbacks.onDone();
      } else {
        tick();
      }
    }, Math.max(0, delayMs));
  }

  if (!paused && timeline.length > 0) {
    tick();
  } else if (timeline.length === 0) {
    callbacks.onDone();
  }

  return {
    pause() {
      if (paused || stopped) return;
      paused = true;
      if (nextTimeoutId) {
        clearTimeout(nextTimeoutId);
        nextTimeoutId = null;
      }
    },
    resume() {
      if (!paused || stopped) return;
      paused = false;
      tick();
    },
    setSpeed(n: number) {
      if (n <= 0 || stopped) return;
      const wasRunning = !paused && nextTimeoutId !== null;
      if (nextTimeoutId) {
        clearTimeout(nextTimeoutId);
        nextTimeoutId = null;
      }
      speed = n;
      if (wasRunning) {
        tick();
      }
    },
    stop() {
      if (stopped) return;
      stopped = true;
      paused = false;
      if (nextTimeoutId) {
        clearTimeout(nextTimeoutId);
        nextTimeoutId = null;
      }
    },
  };
}
