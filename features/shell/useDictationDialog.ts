"use client";

import { useState } from "react";

export type DictationTarget = "pastebin" | "chat";

export interface DictationDialogState {
  isOpen: boolean;
  openFor: (target: DictationTarget) => void;
  closeDictation: () => void;
  insertText: (text: string) => void;
}

export function useDictationDialog(
  onInsert: (target: DictationTarget, text: string) => void,
): DictationDialogState {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<DictationTarget | null>(null);

  const openFor = (nextTarget: DictationTarget) => {
    setTarget(nextTarget);
    setIsOpen(true);
  };

  const closeDictation = () => setIsOpen(false);

  const insertText = (text: string) => {
    if (target) onInsert(target, text);
  };

  return { isOpen, openFor, closeDictation, insertText };
}

export function appendWithSeparator(current: string, addition: string): string {
  const needsSeparator = current && !current.endsWith(" ") && addition;
  return `${current}${needsSeparator ? " " : ""}${addition}`;
}
