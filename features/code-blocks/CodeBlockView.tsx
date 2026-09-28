"use client";

import { useState } from "react";
import CodeBlockActions from "./CodeBlockActions";
import ExplainMenu from "./ExplainMenu";
import MarkdownReport from "./MarkdownReport";
import { useCodeHighlight, useSyncedPanelHeight } from "./codeHighlighting";
import { useExplainReport } from "./useExplainReport";
import { useSyntaxCheck } from "./useSyntaxCheck";

interface Props {
  code: string;
  language: string;
  isReceiver: boolean;
  onOpenCompiler: (code: string, language: string) => void;
  onCopyCode: (code: string) => void;
}

export default function CodeBlockView({
  code,
  language,
  isReceiver,
  onOpenCompiler,
  onCopyCode,
}: Props) {
  const [isSyntaxPanelOpen, setIsSyntaxPanelOpen] = useState(false);

  const highlightedCode = useCodeHighlight(code, language);
  const { report, state, hasErrors } = useSyntaxCheck(code);
  const explain = useExplainReport(code);
  const { codePreRef, panelHeight, isPanelVisible } = useSyncedPanelHeight(
    code,
    explain.explanation,
    explain.isLoading,
  );

  return (
    <div
      className={`relative w-full max-w-full overflow-visible ${isReceiver ? "my-6" : "my-3"}`}
    >
      <div
        className={`grid gap-4 transition-all duration-500 w-full max-w-full overflow-visible min-h-0 ${isPanelVisible ? "lg:grid-cols-2" : "grid-cols-1"}`}
      >
        <div className="relative group/code w-full max-w-full overflow-visible min-h-0">
          <div className="absolute top-0 left-0 flex z-20 border-b border-r border-edge rounded-br-lg overflow-visible bg-code">
            <ExplainMenu onSelect={explain.run} isLoading={explain.isLoading} />
          </div>

          <CodeBlockActions
            language={language}
            code={code}
            syntaxState={state}
            hasSyntaxErrors={hasErrors}
            isSyntaxPanelOpen={isSyntaxPanelOpen}
            onToggleSyntaxPanel={() => setIsSyntaxPanelOpen(!isSyntaxPanelOpen)}
            onOpenCompiler={onOpenCompiler}
            onCopyCode={onCopyCode}
          />

          <pre
            ref={codePreRef}
            style={isPanelVisible ? { height: panelHeight } : undefined}
            className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto bg-code text-code-ink border border-edge m-0 text-left transition-all duration-300 w-full max-w-full ${
              isPanelVisible ? "" : "max-h-[350px]"
            } ${isReceiver ? "p-5" : ""}`}
          >
            <code
              className={`text-xs font-mono hljs language-${language} whitespace-pre-wrap break-words block`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          </pre>

          {isSyntaxPanelOpen && report && (
            <div className="relative mt-2 p-3 pl-4 rounded-lg border border-amber-500/40 bg-surface text-left overflow-y-auto max-h-[260px]">
              <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] px-3 py-1 font-bold uppercase rounded-br-lg select-none">
                Syntax Check
              </div>
              <div className="pt-5 text-[12px]">
                <MarkdownReport text={report} />
              </div>
            </div>
          )}
        </div>

        {isPanelVisible && (
          <div
            style={{ height: panelHeight }}
            className="relative p-5 pt-12 rounded-lg border border-accent/30 bg-surface overflow-y-auto min-h-0 transition-all duration-300 text-left w-full max-w-full"
          >
            <div className="absolute top-0 left-0 bg-accent text-[10px] px-3 py-1.5 text-white font-bold uppercase rounded-br-lg select-none">
              {explain.activeMode} MODE
            </div>

            <button
              onClick={explain.clear}
              className="absolute top-2.5 right-3 text-muted hover:text-accent transition-colors cursor-pointer text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {explain.isLoading ? (
              <div className="flex items-center gap-2 text-ok font-mono text-sm mt-4 animate-pulse">
                <span>Generating explanation...</span>
              </div>
            ) : (
              <MarkdownReport text={explain.explanation} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
