"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

interface Options {
  onLongPress: () => void;
  delay?: number;
}

/**
 * Long-press detection for touch/pen input. Mouse input is ignored so pointer
 * devices keep their hover-reveal behaviour, and the click that follows a
 * long-press is swallowed so revealing actions never also triggers one.
 *
 * Spread the returned handlers onto the element that should be pressable.
 */
export function useLongPress({ onLongPress, delay = 500 }: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const onLongPressRef = useRef(onLongPress);

  useEffect(() => {
    onLongPressRef.current = onLongPress;
  }, [onLongPress]);

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse") return;
      firedRef.current = false;
      clear();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        firedRef.current = true;
        onLongPressRef.current();
      }, delay);
    },
    [clear, delay],
  );

  const onPointerUp = useCallback(() => clear(), [clear]);

  const onClickCapture = useCallback((event: ReactMouseEvent) => {
    if (!firedRef.current) return;
    firedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onContextMenu = useCallback((event: ReactMouseEvent) => {
    if (timerRef.current !== null || firedRef.current) event.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: onPointerUp,
    onPointerLeave: onPointerUp,
    onClickCapture,
    onContextMenu,
  };
}
