const VIRTUAL_CAMERA_PATTERNS: RegExp[] = [
  /obs/i,
  /virtual/i,
  /manycam/i,
  /xsplit/i,
  /snap\s*camera/i,
  /\bndi\b/i,
  /droidcam/i,
  /epoccam/i,
  /iriun/i,
  /\bcamo\b/i,
  /e2esoft/i,
  /\bvcam\b/i,
  /fake/i,
  /dummy/i,
  /screen\s*capture/i,
  /window\s*capture/i,
];

export function isVirtualCameraLabel(label: string | null | undefined): boolean {
  if (!label) return false;
  return VIRTUAL_CAMERA_PATTERNS.some((pattern) => pattern.test(label));
}

export interface CameraProbeResult {
  stream: MediaStream;
  label: string;
  deviceId: string | null;
  isNative: boolean;
  reason: string | null;
}

/**
 * Requests a webcam stream and verifies that it is a physical/native device
 * rather than a virtual camera (OBS, ManyCam, DroidCam, NDI, etc.).
 */
export async function acquireNativeCamera(): Promise<CameraProbeResult> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera API is not supported in this browser. Please use Chrome, Edge, or Firefox.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
    audio: false,
  });

  const track = stream.getVideoTracks()[0];
  const settings = track ? track.getSettings() : { deviceId: undefined };
  const deviceId = settings.deviceId ?? null;

  let label = track?.label ?? "";
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const match = devices.find(
      (device) => device.kind === "videoinput" && (device.deviceId === deviceId || device.label === label)
    );
    if (match?.label) label = match.label;
  } catch {
    // Ignore enumeration errors; fall back to the track label.
  }

  const isNative = !isVirtualCameraLabel(label);

  return {
    stream,
    label,
    deviceId,
    isNative,
    reason: isNative ? null : `Virtual camera detected ("${label || "unknown device"}"). A physical webcam is required.`,
  };
}

/** Reports whether the browser is currently spread across more than one display. */
export function isExtendedDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const screen = window.screen as Screen & { isExtended?: boolean };
  return screen?.isExtended === true;
}
