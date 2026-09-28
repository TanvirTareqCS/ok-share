"use client";

import { useState } from "react";
import { requestExplanation } from "@/lib/api/explainClient";
import type { ExplainMode } from "@/lib/types";
import { runCachedSyntaxCheck } from "./syntaxCheckCache";

export interface ExplainReport {
  explanation: string | null;
  activeMode: ExplainMode | null;
  isLoading: boolean;
  isPanelVisible: boolean;
  run: (mode: ExplainMode) => void;
  clear: () => void;
}

export function useExplainReport(code: string): ExplainReport {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ExplainMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const run = (mode: ExplainMode) => {
    setIsLoading(true);
    setActiveMode(mode);
    setExplanation(null);

    const fetchReport =
      mode === "SYNTAX" ? runCachedSyntaxCheck(code) : requestExplanation(code, mode);

    fetchReport
      .then((result) => setExplanation(result))
      .catch((error: Error) => setExplanation(`Error: ${error.message}`))
      .finally(() => setIsLoading(false));
  };

  const clear = () => {
    setExplanation(null);
    setActiveMode(null);
  };

  return {
    explanation,
    activeMode,
    isLoading,
    isPanelVisible: Boolean(explanation) || isLoading,
    run,
    clear,
  };
}
