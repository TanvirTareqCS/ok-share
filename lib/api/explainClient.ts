import type { ExplainMode } from "@/lib/types";

interface ExplainResponse {
  explanation?: string;
  error?: string;
}

export async function requestExplanation(code: string, mode: ExplainMode): Promise<string> {
  const response = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, mode }),
  });

  const data: ExplainResponse = await response.json();
  if (data.error) throw new Error(data.error);
  return data.explanation as string;
}
