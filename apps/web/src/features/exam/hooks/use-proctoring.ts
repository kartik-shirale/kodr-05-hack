import { useState, useCallback, useRef } from "react";

interface UseProctoringOptions {
  onEvent: (type: string, durationMs?: number, snapshotBlob?: Blob, meta?: Record<string, unknown>) => void;
  enabled?: boolean;
}

export function useProctoring({ onEvent, enabled = true }: UseProctoringOptions) {
  const [isSimulating, setIsSimulating] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Expose a helper to capture a snapshot from video stream
  const captureSnapshot = useCallback(async (videoElement: HTMLVideoElement | null): Promise<Blob | null> => {
    if (!videoElement) return null;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 320;
      canvas.height = videoElement.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          "image/jpeg",
          0.7
        );
      });
    } catch {
      return null;
    }
  }, []);

  // Developer simulator helper as requested by prompt
  const simulateEvent = useCallback(
    async (type: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "PHONE_DETECTED" | "TAB_SWITCH", videoElement?: HTMLVideoElement | null) => {
      setIsSimulating(true);
      try {
        let snapshot: Blob | null = null;
        if (videoElement) {
          snapshot = await captureSnapshot(videoElement);
        }
        onEvent(type, 2000, snapshot || undefined, { simulated: true });
      } finally {
        setIsSimulating(false);
      }
    },
    [captureSnapshot, onEvent]
  );

  return {
    simulateEvent,
    isSimulating,
  };
}
