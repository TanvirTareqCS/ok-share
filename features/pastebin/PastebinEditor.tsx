"use client";

import { MicrophoneIcon } from "@/components/icons/ActionIcons";

interface Props {
  text: string;
  isMasking: boolean;
  onTextChange: (text: string) => void;
  onOpenDictation: () => void;
}

export default function PastebinEditor({ text, isMasking, onTextChange, onOpenDictation }: Props) {
  return (
    <div className="w-full mb-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface p-2 pl-3 border border-edge border-b-0 rounded-t-lg">
        <span className="text-xs font-semibold text-muted">Type or dictate your payload</span>
        <button
          type="button"
          onClick={onOpenDictation}
          className="inline-flex items-center justify-center gap-1.5 bg-surface2 text-ink text-xs font-semibold px-3 py-1.5 rounded-md border border-edge hover:border-edge2 transition-colors"
        >
          <MicrophoneIcon />
          Dictate
        </button>
      </div>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        disabled={isMasking}
        className="w-full h-72 sm:h-96 bg-code text-code-ink font-mono p-4 rounded-b-lg text-sm focus:outline-none resize-none disabled:opacity-80"
        placeholder={
          "Type normal text, or wrap code like this:\n\n'''python'''\nprint('Hello World')\n'''/python'''"
        }
      />
    </div>
  );
}
