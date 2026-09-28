"use client";

import { MicrophoneIcon, SendIcon } from "@/components/icons/ActionIcons";

interface Props {
  text: string;
  isSending: boolean;
  isLocked: boolean;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onOpenDictation: () => void;
  onStopTyping: () => void;
}

export default function GroupComposer({
  text,
  isSending,
  isLocked,
  onTextChange,
  onSend,
  onOpenDictation,
  onStopTyping,
}: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
      className="flex items-end gap-2"
    >
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        onBlur={onStopTyping}
        placeholder={
          isLocked ? "Unlock the channel to send messages" : "Type update (Shift+Enter for new line)"
        }
        className="flex-1 min-h-[48px] max-h-[150px] rounded-lg p-3 font-mono text-sm resize-none"
        rows={2}
      />
      <button
        type="button"
        onClick={onOpenDictation}
        className="h-[48px] w-12 shrink-0 bg-surface2 hover:bg-edge text-ink border border-edge rounded-lg transition-colors flex items-center justify-center"
        title="Dictate"
      >
        <MicrophoneIcon />
      </button>
      <button
        type="submit"
        disabled={isSending}
        className="h-[48px] px-5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-1.5"
      >
        <SendIcon />
        Send
      </button>
    </form>
  );
}
