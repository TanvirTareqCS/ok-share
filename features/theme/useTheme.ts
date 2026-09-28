"use client";

import { useSyncExternalStore } from "react";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";

export type Theme = "light" | "dark";

const THEME_CHANGE_EVENT = "themeselect";
const THEME_ATTRIBUTE = "data-theme";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onChange);
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute(THEME_ATTRIBUTE) === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute(THEME_ATTRIBUTE, next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return { theme, toggleTheme };
}
