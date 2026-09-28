"use client";

import { useEffect, useRef, useState } from "react";
import { hasSyntaxErrors, runCachedSyntaxCheck } from "./syntaxCheckCache";

export type SyntaxCheckState = "idle" | "checking" | "done";

export interface SyntaxCheckResult {
  report: string | null;
  state: SyntaxCheckState;
  hasErrors: boolean;
}

export function useSyntaxCheck(code: string): SyntaxCheckResult {
  const [report, setReport] = useState<string | null>(null);
  const [state, setState] = useState<SyntaxCheckState>("idle");
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    let isActive = true;
    setState("checking");
    runCachedSyntaxCheck(code).then((result) => {
      if (!isActive) return;
      setReport(result);
      setState("done");
    });

    return () => {
      isActive = false;
    };
  }, [code]);

  return { report, state, hasErrors: hasSyntaxErrors(report) };
}
