"use client";

import { useEffect, useRef } from "react";
import { MicrophoneIcon, PaperclipIcon, SendIcon } from "@/components/icons/ActionIcons";
import { formatFileSize, prepareSharedFile } from "@/lib/crypto/fileCipher";
import type { ReplyTarget } from "@/lib/types";

const FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.js,.jsx,.ts,.tsx,.py,.c,.cpp,.h,.hpp,.java,.rb,.go,.rs,.php,.html,.css,.json,.sh,.yml,.yaml,.sql";

interface Props {
  text: string;
  isSending: boolean;
  isLocked: boolean;
  canAttach: boolean;
  file: File | null;
  replyTarget: ReplyTarget | null;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onOpenDictation: () => void;
  onPickFile: (file: File) => void;
  onClearFile: () => void;
  onStopTyping: () => void;
  onCancelReply: () => void;
}

export default function GroupComposer({
  text,
  isSending,
  isLocked,
  canAttach,
  file,
  replyTarget,
  onTextChange,
  onSend,
  onOpenDictation,
  onPickFile,
  onClearFile,
  onStopTyping,
  onCancelReply,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTarget) textareaRef.current?.focus();
  }, [replyTarget]);

  const handlePickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    const outcome = await prepareSharedFile(picked);
    if (!outcome.ok) {
      alert(outcome.rejected);
      return;
    }
    onPickFile(outcome.file);
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
      className="flex flex-col gap-2"
    >
      {replyTarget && (
        <div className="flex items-center justify-between gap-2 bg-surface2 border border-edge border-l-2 border-l-accent rounded-lg px-3 py-2">
          <div className="min-w-0">
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wide text-accent">
              Replying to @{replyTarget.sender}
            </span>
            <span className="block truncate text-xs text-muted mt-0.5">
              {replyTarget.preview}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-faint hover:text-accent text-xs font-bold shrink-0"
            title="Cancel reply (Esc)"
          >
            ✕
          </button>
        </div>
      )}
      {file && (
        <div className="flex items-center justify-between gap-2 bg-surface2 border border-edge rounded-lg px-3 py-2">
          <span className="truncate font-mono text-xs text-muted">
            <span className="text-accent font-semibold uppercase text-[10px] mr-2">FILE</span>
            {file.name} <span className="text-faint">({formatFileSize(file.size)})</span>
          </span>
          <button
            type="button"
            onClick={onClearFile}
            className="text-faint hover:text-accent text-xs font-bold shrink-0"
            title="Remove file"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} className="hidden" onChange={handlePickFile} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttach}
          title={canAttach ? "Attach a file" : "Seal the channel to share files"}
          className="h-[48px] w-12 shrink-0 bg-surface2 hover:bg-edge text-ink border border-edge rounded-lg transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PaperclipIcon />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && replyTarget) {
              event.preventDefault();
              onCancelReply();
              return;
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          onBlur={onStopTyping}
          placeholder={
            isLocked
              ? "Unlock the channel to send messages"
              : replyTarget
                ? "Type your reply (Esc to cancel)"
                : "Type update (Shift+Enter for new line)"
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
      </div>
    </form>
  );
}