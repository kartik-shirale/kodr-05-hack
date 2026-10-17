import { useEffect, useRef } from "react";

interface UseTabVisibilityOptions {
  onTabLeave?: () => void;
  onTabReturn?: () => void;
  enabled?: boolean;
}

export function useTabVisibility({
  onTabLeave,
  onTabReturn,
  enabled = true,
}: UseTabVisibilityOptions) {
  const isTabActiveRef = useRef(true);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isTabActiveRef.current) {
          isTabActiveRef.current = false;
          onTabLeave?.();
        }
      } else {
        if (!isTabActiveRef.current) {
          isTabActiveRef.current = true;
          onTabReturn?.();
        }
      }
    };

    const handleBlur = () => {
      if (isTabActiveRef.current) {
        isTabActiveRef.current = false;
        onTabLeave?.();
      }
    };

    const handleFocus = () => {
      if (!isTabActiveRef.current) {
        isTabActiveRef.current = true;
        onTabReturn?.();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [enabled, onTabLeave, onTabReturn]);

  return {
    isTabActive: isTabActiveRef.current,
  };
}
