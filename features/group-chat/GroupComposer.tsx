"use client";

import { useRef } from "react";
import { MicrophoneIcon, PaperclipIcon, SendIcon } from "@/components/icons/ActionIcons";
import { formatFileSize, prepareSharedFile } from "@/lib/crypto/fileCipher";

const FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.js,.jsx,.ts,.tsx,.py,.c,.cpp,.h,.hpp,.java,.rb,.go,.rs,.php,.html,.css,.json,.sh,.yml,.yaml,.sql";

interface Props {
  text: string;
  isSending: boolean;
  isLocked: boolean;
  canAttach: boolean;
  file: File | null;
  onTextChange: (text: string) => void;
  onSend: () => void;
  onOpenDictation: () => void;
  onPickFile: (file: File) => void;
  onClearFile: () => void;
  onStopTyping: () => void;
}

export default function GroupComposer({
  text,
  isSending,
  isLocked,
  canAttach,
  file,
  onTextChange,
  onSend,
  onOpenDictation,
  onPickFile,
  onClearFile,
  onStopTyping,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      </div>
    </form>
  );
}