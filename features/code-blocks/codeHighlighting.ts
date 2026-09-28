"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js";

export function useCodeHighlight(code: string, language: string): string {
  return useMemo(() => {
    try {
      return hljs.getLanguage(language)
        ? hljs.highlight(code, { language }).value
        : hljs.highlightAuto(code).value;
    } catch {
      return code;
    }
  }, [code, language]);
}

export function useSyncedPanelHeight(
  code: string,
  explanation: string | null,
  isLoading: boolean,
) {
  const codePreRef = useRef<HTMLPreElement>(null);
  const [panelHeight, setPanelHeight] = useState("250px");
  const isPanelVisible = Boolean(explanation) || isLoading;

  useEffect(() => {
    if (!isPanelVisible || !codePreRef.current) return;

    const naturalHeight = codePreRef.current.scrollHeight;
    setPanelHeight(naturalHeight < 150 ? `${naturalHeight * 2}px` : `${naturalHeight}px`);
  }, [code, explanation, isLoading, isPanelVisible]);

  return { codePreRef, panelHeight, isPanelVisible };
}
