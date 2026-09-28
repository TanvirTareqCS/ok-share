"use client";

import { useEffect, useRef, useState } from "react";
import { EXPLAIN_MODES } from "./explainModes";
import type { ExplainMode } from "@/lib/types";

interface Props {
  onSelect: (mode: ExplainMode) => void;
  isLoading: boolean;
}

export default function ExplainMenu({ onSelect, isLoading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleModeSelect = (mode: ExplainMode) => {
    onSelect(mode);
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        type="button"
        disabled={isLoading}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-t-0 border-b-0 border-l border-black/20 flex items-center gap-1 cursor-pointer rounded-tl-lg"
      >
        {isLoading ? "Thinking..." : "Explain Code"}
      </button>

      {!isLoading && isOpen && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-surface border border-edge rounded-md shadow-2xl z-50 overflow-hidden">
          {EXPLAIN_MODES.map((mode, index) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleModeSelect(mode.id)}
              className={`w-full text-left px-4 py-2.5 text-xs text-ink bg-surface hover:bg-accent hover:text-white transition-colors font-semibold cursor-pointer ${index < EXPLAIN_MODES.length - 1 ? "border-b border-edge" : ""}`}
              title={mode.tooltip}
            >
              {mode.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
