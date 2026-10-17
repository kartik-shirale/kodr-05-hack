import { useEffect, useRef } from "react";

interface UseFrameCaptureOptions {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onFrame: (blob: Blob) => void | Promise<void>;
  minDelayMs?: number;
  maxDelayMs?: number;
}

async function captureFrame(video: HTMLVideoElement | null): Promise<Blob | null> {
  if (!video || !video.videoWidth || !video.videoHeight) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.7);
  });
}

/**
 * Captures a JPEG frame from the webcam at a random interval between
 * minDelayMs and maxDelayMs (default 1-5 seconds) and hands it to onFrame.
 * Stops automatically when `enabled` becomes false (submit / time-up / camera off).
 */
export function useFrameCapture({
  enabled,
  videoRef,
  onFrame,
  minDelayMs = 1000,
  maxDelayMs = 5000,
}: UseFrameCaptureOptions) {
  const onFrameRef = useRef(onFrame);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = () => {
      const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
      timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const blob = await captureFrame(videoRef.current);
          if (blob && !cancelled) {
            await onFrameRef.current(blob);
          }
        } catch {
          // Transient capture/upload failures are ignored; the next tick retries.
        }
        if (!cancelled) tick();
      }, delay);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, videoRef, minDelayMs, maxDelayMs]);
}
