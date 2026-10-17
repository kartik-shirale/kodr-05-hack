import { useEffect, useState, useRef } from "react";

export interface UseCountdownOptions {
  targetIso?: string | null;
  endsAt?: string | null; // for backward compatibility
  serverTime?: string | null;
  onTimeUp?: () => void;
}

export interface UseCountdownReturn {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  remainingMs: number | null;
  isFinished: boolean;
  secondsRemaining: number | null;
  isLowTime: boolean;
}

export function useCountdown({
  targetIso,
  endsAt,
  serverTime,
  onTimeUp,
}: UseCountdownOptions): UseCountdownReturn {
  const target = targetIso ?? endsAt ?? null;
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  // Compute the clock offset once: offset = Date.parse(serverTime) - Date.now()
  const offsetRef = useRef<number | null>(null);
  if (offsetRef.current === null && serverTime) {
    const parsedServer = Date.parse(serverTime);
    if (!Number.isNaN(parsedServer)) {
      offsetRef.current = parsedServer - Date.now();
    }
  }

  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const hasFiredOnTimeUp = useRef(false);

  useEffect(() => {
    if (!target) {
      setRemainingMs(null);
      return;
    }

    const targetMs = Date.parse(target);
    if (Number.isNaN(targetMs)) {
      setRemainingMs(null);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const calculateRemaining = () => {
      const offset = offsetRef.current ?? 0;
      const now = Date.now();
      const currentRemaining = targetMs - (now + offset);
      const clamped = Math.max(0, currentRemaining);
      setRemainingMs(clamped);

      if (clamped <= 0) {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (!hasFiredOnTimeUp.current) {
          hasFiredOnTimeUp.current = true;
          onTimeUpRef.current?.();
        }
      }
    };

    // Calculate immediately on mount or when target/serverTime changes
    calculateRemaining();

    // Start 1-second interval if remaining time > 0
    const offset = offsetRef.current ?? 0;
    const initialRemaining = targetMs - (Date.now() + offset);
    if (initialRemaining > 0) {
      intervalId = setInterval(calculateRemaining, 1000);
    }

    // Recalculate immediately on visibilitychange
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        calculateRemaining();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [target, serverTime]);

  const totalSeconds = remainingMs !== null ? Math.max(0, Math.floor(remainingMs / 1000)) : 0;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isFinished = remainingMs !== null && remainingMs <= 0;

  const secondsRemaining = remainingMs !== null ? totalSeconds : null;
  const isLowTime = secondsRemaining !== null && secondsRemaining <= 300;

  return {
    days,
    hours,
    minutes,
    seconds,
    remainingMs,
    isFinished,
    secondsRemaining,
    isLowTime,
  };
}
