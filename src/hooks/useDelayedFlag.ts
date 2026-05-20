import { useEffect, useRef, useState } from "react";

export function useDelayedFlag(flag: boolean, delayMs: number, resetKey?: string | number) {
  const startedAtRef = useRef<number | null>(null);
  const cycleKeyRef = useRef<string>("");
  const [tick, setTick] = useState(0);
  const cycleKey = `${flag ? 1 : 0}|${delayMs}|${String(resetKey ?? "")}`;

  if (!flag) {
    startedAtRef.current = null;
    cycleKeyRef.current = "";
  } else if (startedAtRef.current === null || cycleKeyRef.current !== cycleKey) {
    startedAtRef.current = Date.now();
    cycleKeyRef.current = cycleKey;
  }

  useEffect(() => {
    if (!flag) return;

    const startedAt = startedAtRef.current ?? Date.now();
    const remainingMs = Math.max(0, startedAt + delayMs - Date.now());
    const timeoutId = setTimeout(() => {
      setTick((v) => v + 1);
    }, remainingMs);

    return () => clearTimeout(timeoutId);
  }, [flag, delayMs, resetKey]);

  if (!flag || startedAtRef.current === null) return false;
  void tick;
  return Date.now() - startedAtRef.current >= delayMs;
}
