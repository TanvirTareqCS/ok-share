import type { CompileResult, CompilerLanguageId } from "@/lib/types";

export type CompileOutcome =
  | { kind: "ok"; result: CompileResult }
  | { kind: "http-error"; status: number }
  | { kind: "network-error"; message: string };

export async function runCodeOnEngine(
  compiler: CompilerLanguageId,
  code: string,
  input: string,
): Promise<CompileOutcome> {
  try {
    const response = await fetch("/api/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compiler, code, input }),
    });

    if (!response.ok) return { kind: "http-error", status: response.status };

    return { kind: "ok", result: (await response.json()) as CompileResult };
  } catch (error) {
    return { kind: "network-error", message: (error as Error).message };
  }
}
