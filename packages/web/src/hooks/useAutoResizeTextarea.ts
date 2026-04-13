import { useCallback, useEffect, useRef } from "react";

interface UseAutoResizeTextareaOptions {
  /** Minimum height in pixels. Defaults to 44. */
  minHeight?: number;
  /** Maximum height in pixels before scroll kicks in. Defaults to 240. */
  maxHeight?: number;
}

/**
 * Automatically resizes a textarea to fit its content.
 * Clamps between minHeight and maxHeight — scrolls past max.
 */
export function useAutoResizeTextarea<T extends HTMLTextAreaElement = HTMLTextAreaElement>(
  value: string,
  options: UseAutoResizeTextareaOptions = {},
) {
  const { minHeight = 44, maxHeight = 240 } = options;
  const ref = useRef<T | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minHeight, maxHeight]);

  useEffect(() => {
    resize();
  }, [value, resize]);

  return ref;
}
