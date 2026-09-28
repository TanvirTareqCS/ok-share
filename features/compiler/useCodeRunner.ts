"use client";

import { useCallback, useState } from "react";
import { runCodeOnEngine } from "@/lib/api/compileClient";
import { resolveCompilerLanguage } from "./compilerLanguages";

const READY_MESSAGE =
  'Ready to compile. Press "Run Code".\nNote: Interactive inputs (like C++ cin) must be provided in the Standard Input box before running.';

export interface CodeRunner {
  code: string;
  setCode: (code: string) => void;
  language: string;
  input: string;
  setInput: (input: string) => void;
  output: string;
  isCompiling: boolean;
  loadCode: (code: string, language: string) => void;
  execute: () => void;
}

export function useCodeRunner(): CodeRunner {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  const loadCode = useCallback((nextCode: string, nextLanguage: string) => {
    setCode(nextCode);
    setLanguage(nextLanguage.toLowerCase());
    setInput("");
    setOutput(READY_MESSAGE);
  }, []);

  const execute = useCallback(() => {
    const run = async () => {
      const compiler = resolveCompilerLanguage(language);

      if (!compiler) {
        setOutput(`Language '${language}' is not supported on this engine.`);
        return;
      }

      const outcome = await runCodeOnEngine(compiler, code, input);

      if (outcome.kind === "http-error") {
        setOutput(`--- SERVER ERROR ${outcome.status} ---\nFailed to reach the API route.`);
        return;
      }

      if (outcome.kind === "network-error") {
        setOutput(
          `Error: Could not connect to the compilation server.\nDetails: ${outcome.message}`,
        );
        return;
      }

      const { result } = outcome;
      if (result.status === "success") {
        setOutput(result.output || "Program finished successfully with no output.");
      } else {
        setOutput("--- COMPILER ERROR ---\n" + (result.error || "Execution failed."));
      }
    };

    setIsCompiling(true);
    setOutput("Sending to secure backend...");

    run().finally(() => setIsCompiling(false));
  }, [code, input, language]);

  return {
    code,
    setCode,
    language,
    input,
    setInput,
    output,
    isCompiling,
    loadCode,
    execute,
  };
}
