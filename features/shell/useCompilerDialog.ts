"use client";

import { useState } from "react";

export interface CompilerDialogState {
  isOpen: boolean;
  payload: { code: string; language: string };
  openCompiler: (code: string, language: string) => void;
  closeCompiler: () => void;
}

export function useCompilerDialog(): CompilerDialogState {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState({ code: "", language: "" });

  const openCompiler = (code: string, language: string) => {
    setPayload({ code, language });
    setIsOpen(true);
  };

  const closeCompiler = () => setIsOpen(false);

  return { isOpen, payload, openCompiler, closeCompiler };
}
