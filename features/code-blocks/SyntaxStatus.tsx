"use client";

import type { SyntaxCheckState } from "./useSyntaxCheck";

interface Props {
  state: SyntaxCheckState;
  hasErrors: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export default function SyntaxStatus({ state, hasErrors, isOpen, onToggle }: Props) {
  if (state === "checking") {
    return (
      <span
        title="Checking syntax…"
        className="bg-code text-[10px] px-3 py-1.5 text-amber-400 font-bold uppercase select-none animate-pulse"
      >
        ●
      </span>
    );
  }

  if (state !== "done") return null;

  if (!hasErrors) {
    return (
      <span
        title="No syntax errors"
        className="bg-code text-[10px] px-3 py-1.5 text-ok font-bold uppercase select-none"
      >
        ✓
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isOpen ? "Hide issues" : "Show syntax issues & fixes"}
      className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] px-3 py-1.5 font-bold uppercase transition-colors border-r border-black/20 cursor-pointer"
    >
      ⚠ {isOpen ? "Hide" : "Issues"}
    </button>
  );
}
