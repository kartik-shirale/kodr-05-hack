"use client";

import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, RefreshCw, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { acquireNativeCamera } from "@/features/exam/lib/camera";

interface CameraCheckProps {
  onStatusChange?: (isReady: boolean) => void;
}

export function CameraCheck({ onStatusChange }: CameraCheckProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceLabel, setDeviceLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const probe = await acquireNativeCamera();

      if (!probe.isNative) {
        probe.stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setDeviceLabel(null);
        setError(probe.reason ?? "Virtual camera detected. A physical webcam is required.");
        onStatusChange?.(false);
        return;
      }

      stopStream();
      streamRef.current = probe.stream;
      setStream(probe.stream);
      setDeviceLabel(probe.label || null);
      if (videoRef.current) {
        videoRef.current.srcObject = probe.stream;
      }
      onStatusChange?.(true);
    } catch (err) {
      const isDenied = err instanceof DOMException && err.name === "NotAllowedError";
      const msg = isDenied
        ? "Camera permission denied. Please allow camera access in your browser settings to proceed."
        : err instanceof Error
          ? err.message
          : "Failed to initialize webcam.";
      setError(msg);
      onStatusChange?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      stopStream();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden border border-border/80 bg-black flex items-center justify-center shadow-xs">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!stream ? "hidden" : ""}`}
        />

        {!stream && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground space-y-2">
            <VideoOff className="size-8 text-muted-foreground/60" />
            <p className="text-xs">Webcam feed not available</p>
          </div>
        )}

        {stream && (
          <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="max-w-56 truncate">{deviceLabel ? `Camera Active — ${deviceLabel}` : "Camera Active"}</span>
          </div>
        )}
      </div>

      {error ? (
        <Alert variant="destructive" className="text-xs">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button size="xs" variant="outline" onClick={startCamera} className="ml-2 shrink-0">
              <RefreshCw className="mr-1 size-3" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : stream ? (
        <p className="text-xs text-emerald-600 flex items-center justify-center gap-1 font-medium text-center">
          <CheckCircle2 className="size-3.5" />
          <span>Physical webcam verified. Frames are analysed during the exam; only high-risk evidence is stored.</span>
        </p>
      ) : null}
    </div>
  );
}
