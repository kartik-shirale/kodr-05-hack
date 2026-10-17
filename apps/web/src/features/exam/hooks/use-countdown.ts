import { useEffect, useState, useMemo } from "react";

interface UseCountdownOptions {
  endsAt: string | null;
  serverTime?: string | null;
  onTimeUp?: () => void;
}

export function useCountdown({ endsAt, serverTime, onTimeUp }: UseCountdownOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const clockOffsetMs = useMemo(() => {
    if (!serverTime) return 0;
    return new Date(serverTime).getTime() - Date.now();
  }, [serverTime]);

  useEffect(() => {
    if (!endsAt) return;

    const targetTimeMs = new Date(endsAt).getTime();

    const updateTimer = () => {
      const nowSyncedMs = Date.now() + clockOffsetMs;
      const diffMs = targetTimeMs - nowSyncedMs;
      const remaining = Math.max(0, Math.floor(diffMs / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        onTimeUp?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endsAt, clockOffsetMs, onTimeUp]);

  const isLowTime = secondsRemaining !== null && secondsRemaining <= 300; // <= 5 minutes

  return {
    secondsRemaining,
    isLowTime,
  };
}
