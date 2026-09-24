"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { isOpen: boolean; onClose: () => void; initialCode: string; initialLang: string; }

export default function CompilerStudio({ isOpen, onClose, initialCode, initialLang }: Props) {
  const [code, setCode] = useState("");
  const [lang, setLang] = useState("");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode(initialCode); setLang(initialLang.toLowerCase()); setInput("");
      setOutput("Ready to compile. Press \"Run Code\".\nNote: Interactive inputs (like C++ cin) must be provided in the Standard Input box before running.");
    }
  }, [isOpen, initialCode, initialLang]);

  const executeCode = async () => {
    setIsCompiling(true); setOutput("Sending to secure backend...");
    try {
      let mappedLang = "";
      if (lang === 'python') mappedLang = 'python-3.14';
      if (lang === 'javascript' || lang === 'node') mappedLang = 'typescript-deno'; 
      if (lang === 'c++' || lang === 'cpp') mappedLang = 'g++-15';
      if (lang === 'c#') mappedLang = 'dotnet-csharp-9';
      if (lang === 'ruby') mappedLang = 'ruby-4.0';
      if (lang === 'java') mappedLang = 'openjdk-25';

      if (!mappedLang) { setOutput(`Language '${lang}' is not supported on this engine.`); setIsCompiling(false); return; }

      const res = await fetch("/api/compile", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler: mappedLang, code, input })
      });
      if (!res.ok) { setOutput(`--- SERVER ERROR ${res.status} ---\nFailed to reach the API route.`); setIsCompiling(false); return; }
      const data = await res.json();
      if (data.status === "success") setOutput(data.output || "Program finished successfully with no output.");
      else setOutput("--- COMPILER ERROR ---\n" + (data.error || "Execution failed."));
    } catch (err: any) { setOutput(`Error: Could not connect to the compilation server.\nDetails: ${err.message}`); }
    setIsCompiling(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-sm">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-surface border border-edge w-full max-w-4xl h-[90vh] max-h-[720px] rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-edge bg-surface2/60 shrink-0">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                Execution Studio
                {lang && <span className="text-muted text-xs uppercase px-2 py-0.5 bg-code text-code-ink rounded">({lang})</span>}
              </h3>
              <button onClick={onClose} className="text-muted hover:text-accent font-bold text-xl transition-colors" aria-label="Close">✕</button>
            </div>
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="flex-1 flex flex-col border-r border-edge min-h-0">
                <div className="px-4 py-2 text-xs text-muted font-semibold uppercase tracking-wider shrink-0">Source Code (Editable)</div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} className="flex-1 w-full bg-code text-code-ink font-mono p-4 focus:outline-none resize-none text-sm" spellCheck="false" />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="h-24 lg:h-1/3 flex flex-col border-b border-edge min-h-0 shrink-0">
                  <div className="px-4 py-2 text-xs text-muted font-semibold uppercase tracking-wider">Standard Input (stdin)</div>
                  <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter inputs here before running..." className="flex-1 w-full bg-code text-code-ink font-mono p-4 focus:outline-none resize-none text-sm" spellCheck="false" />
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-2 text-xs text-muted font-semibold uppercase tracking-wider flex justify-between items-center">
                    <span>Terminal Output</span>
                    {isCompiling && <span className="text-ok animate-pulse text-[10px]">Processing...</span>}
                  </div>
                  <pre className="flex-1 min-h-0 w-full bg-code text-code-ink font-mono p-4 overflow-y-auto text-sm whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            </div>
            <div className="p-4 bg-surface2/60 border-t border-edge flex justify-end shrink-0">
              <button onClick={executeCode} disabled={isCompiling} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white px-8 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z" /></svg>
                <span>{isCompiling ? "Executing..." : "Run Code"}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}