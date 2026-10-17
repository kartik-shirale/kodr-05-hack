import { useState, useCallback, useRef } from "react";
import { uploadExamEventApi } from "../api";
import type { ExamEventResponse } from "../schemas";

export function useEventQueue(onWarning?: (warning: ExamEventResponse["warning"]) => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const queueRef = useRef<FormData[]>([]);

  const processNext = useCallback(async () => {
    if (isProcessing || queueRef.current.length === 0) return;

    setIsProcessing(true);
    const nextFormData = queueRef.current[0];

    try {
      const response = await uploadExamEventApi(nextFormData);
      queueRef.current.shift();
      if (response.data.warning) {
        onWarning?.(response.data.warning);
      }
    } catch {
      // Keep in queue to retry when online
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onWarning]);

  const enqueueEvent = useCallback(
    (formData: FormData) => {
      queueRef.current.push(formData);
      processNext();
    },
    [processNext]
  );

  return {
    enqueueEvent,
    isProcessing,
  };
}
