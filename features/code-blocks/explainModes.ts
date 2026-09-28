import type { ExplainMode } from "@/lib/types";

export interface ExplainModeOption {
  id: ExplainMode;
  label: string;
  tooltip: string;
}

export const EXPLAIN_MODES: readonly ExplainModeOption[] = [
  { id: "SYNTAX", label: "Check Syntax", tooltip: "Find syntax errors and suggested fixes" },
  { id: "ADIB", label: "ADIB Mode", tooltip: "Simple Bangla explanation" },
  { id: "FABIHA", label: "FABIHA Mode", tooltip: "Easy English explanation" },
  { id: "MAHATAB", label: "MAHATAB Mode", tooltip: "Explain the thing shortly" },
  { id: "MAHIN", label: "MAHIN Mode", tooltip: "Explain the easiest thing in detail" },
];

export const NO_SYNTAX_ERRORS_MARKER = "no syntax errors";
export const NO_SYNTAX_ERRORS_REPLY = "No syntax errors found — code looks valid.";
