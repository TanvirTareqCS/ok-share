"use client";

import { useEffect, useRef, useState } from "react";
import { PaperclipIcon } from "@/components/icons/ActionIcons";
import { fileKindLabel, formatFileSize, prepareSharedFile } from "@/lib/crypto/fileCipher";
import type { AttachmentDraft } from "@/lib/types";

function ChipThumb({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(
    () => () => {
      URL.revokeObjectURL(url);
    },
    [url],
  );
  if (!url) return <div className="h-10 w-10 shrink-0 rounded-md border border-edge bg-surface2" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={file.name} className="h-10 w-10 shrink-0 rounded-md border border-edge object-cover" />
  );
}

const FILE_ACCEPT =
  "image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.md,.csv,.js,.jsx,.ts,.tsx,.py,.c,.cpp,.h,.hpp,.java,.rb,.go,.rs,.php,.html,.css,.json,.sh,.yml,.yaml,.sql";

interface Props {
  files: AttachmentDraft[];
  isLocked: boolean;
  onAddFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
}

export default function PastebinFilePicker({ files, isLocked, onAddFiles, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";

    const prepared = await Promise.all(picked.map((file) => prepareSharedFile(file)));
    const accepted = prepared.filter((outcome) => outcome.ok).map((outcome) => outcome.file);
    const rejected = prepared
      .filter((outcome) => !outcome.ok)
      .map((outcome) => outcome.rejected);

    if (rejected.length > 0) alert(rejected.join("\n"));
    if (accepted.length > 0) onAddFiles(accepted);
  };

  return (
    <div className="w-full mb-4">
      <input ref={inputRef} type="file" multiple accept={FILE_ACCEPT} className="hidden" onChange={handlePick} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isLocked}
        className="inline-flex items-center gap-1.5 bg-surface2 text-ink text-xs font-semibold px-3 py-1.5 rounded-md border border-edge hover:border-edge2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PaperclipIcon />
        Attach files
      </button>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 bg-surface2/60 border border-edge rounded-lg px-3 py-2"
            >
              {file.kind === "image" && <ChipThumb file={file.file} />}
              <span className="shrink-0 text-[10px] font-bold uppercase text-ok bg-ok/10 border border-ok/30 rounded px-1.5 py-0.5">
                {fileKindLabel(file.kind)}
              </span>
              <span className="flex-1 truncate font-mono text-xs text-muted">
                {file.name}{" "}
                <span className="text-faint">({formatFileSize(file.size)})</span>
              </span>
              <button
                onClick={() => onRemove(file.id)}
                className="shrink-0 text-faint hover:text-accent text-xs font-bold"
                title="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}