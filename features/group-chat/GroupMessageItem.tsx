"use client";

import { SpeakerIcon } from "@/components/icons/ActionIcons";
import { speakText } from "@/lib/speech/tts";
import RichText from "@/features/code-blocks/RichText";
import GroupFileAttachment from "./GroupFileAttachment";
import type { GroupMessage } from "@/lib/types";

interface Props {
  message: GroupMessage;
  isOwn: boolean;
  channelKey: CryptoKey | null;
  isReadByEveryone: boolean;
  onOpenCompiler: (code: string, language: string) => void;
  onDelete: () => void;
}

export default function GroupMessageItem({
  message,
  isOwn,
  channelKey,
  isReadByEveryone,
  onOpenCompiler,
  onDelete,
}: Props) {
  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="text-xs text-muted mb-1 flex items-center gap-1">
        <span>
          @{message.sender} -{" "}
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {isOwn && (
          <span
            className="text-[10px] text-faint"
            title={isReadByEveryone ? "Read by all members" : "Sent"}
          >
            {isReadByEveryone ? "✓✓" : "✓"}
          </span>
        )}
        {!!message.text && (
          <button
            onClick={() => speakText(message.text as string)}
            className="hover:text-accent transition-colors"
            title="Read aloud"
          >
            <SpeakerIcon />
          </button>
        )}
      </div>

      <div
        className={`p-3 rounded-lg max-w-full lg:max-w-[85%] text-sm relative group border ${isOwn ? "bg-accent-soft border-accent/30 text-ink" : "bg-surface border-edge text-ink"}`}
      >
        {!!message.text && (
          <div className="max-w-none">
            <RichText content={message.text ?? ""} onOpenCompiler={onOpenCompiler} />
          </div>
        )}
        {message.attachment && (
          <GroupFileAttachment attachment={message.attachment} channelKey={channelKey} />
        )}
        {isOwn && (
          <button
            onClick={onDelete}
            className="absolute -top-2 -right-2 bg-accent hover:bg-accent-hover text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow"
            title="Delete message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}