import { requestExplanation } from "@/lib/api/explainClient";

const SYNTAX_REPORT_CACHE = new Map<string, Promise<string>>();

export const SYNTAX_FALLBACK = "Syntax check unavailable.";

export function runCachedSyntaxCheck(code: string): Promise<string> {
  const cached = SYNTAX_REPORT_CACHE.get(code);
  if (cached) return cached;

  const pending = requestExplanation(code, "SYNTAX").catch(() => SYNTAX_FALLBACK);
  SYNTAX_REPORT_CACHE.set(code, pending);
  return pending;
}

export function hasSyntaxErrors(report: string | null): boolean {
  if (report === null) return false;
  return !report.toLowerCase().includes("no syntax errors");
}
