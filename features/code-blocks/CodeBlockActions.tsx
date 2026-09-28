"use client";

import SyntaxStatus from "./SyntaxStatus";
import type { SyntaxCheckState } from "./useSyntaxCheck";

interface Props {
  language: string;
  code: string;
  syntaxState: SyntaxCheckState;
  hasSyntaxErrors: boolean;
  isSyntaxPanelOpen: boolean;
  onToggleSyntaxPanel: () => void;
  onOpenCompiler: (code: string, language: string) => void;
  onCopyCode: (code: string) => void;
}

export default function CodeBlockActions({
  language,
  code,
  syntaxState,
  hasSyntaxErrors,
  isSyntaxPanelOpen,
  onToggleSyntaxPanel,
  onOpenCompiler,
  onCopyCode,
}: Props) {
  return (
    <div className="absolute top-0 right-0 flex z-20 border-b border-l border-edge rounded-bl-lg overflow-visible bg-code">
      <SyntaxStatus
        state={syntaxState}
        hasErrors={hasSyntaxErrors}
        isOpen={isSyntaxPanelOpen}
        onToggle={onToggleSyntaxPanel}
      />
      <button
        onClick={() => onOpenCompiler(code, language)}
        className="bg-accent hover:bg-accent-hover text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-black/20 cursor-pointer"
      >
        Run
      </button>
      <button
        onClick={() => onCopyCode(code)}
        className="bg-surface2 hover:bg-edge text-[10px] px-3 py-1.5 text-ink font-bold uppercase transition-colors cursor-pointer"
      >
        Copy
      </button>
      {language && (
        <div className="bg-code text-[10px] px-3 py-1.5 text-faint font-bold uppercase select-none rounded-tr-lg border-l border-edge">
          {language}
        </div>
      )}
    </div>
  );
}
