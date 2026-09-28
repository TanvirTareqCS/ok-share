"use client";

import { useSyncExternalStore } from "react";

/**
 * Returns false during server rendering and the hydration pass, then true.
 * Use it to gate browser-only state so the first client render matches the
 * server HTML exactly.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
