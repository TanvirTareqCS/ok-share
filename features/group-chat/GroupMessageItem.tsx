"use client";

import { useEffect, useRef } from "react";
import { ReplyIcon, SpeakerIcon } from "@/components/icons/ActionIcons";
import { useLongPress } from "@/lib/useLongPress";
import { speakText } from "@/lib/speech/tts";
import RichText from "@/features/code-blocks/RichText";
import GroupFileAttachment from "./GroupFileAttachment";
import type { GroupMessage, MessageReplyRef } from "@/lib/types";

interface Props {
  message: GroupMessage;
  isOwn: boolean;
  channelKey: CryptoKey | null;
  isReadByEveryone: boolean;
  isReplyTarget: boolean;
  isHighlighted: boolean;
  isRevealed: boolean;
  replyTo?: MessageReplyRef;
  replyPreview?: string;
  onOpenCompiler: (code: string, language: string) => void;
  onDelete: () => void;
  onReply: () => void;
  onReveal: () => void;
  onJumpToReply: () => void;
}

export default function GroupMessageItem({
  message,
  isOwn,
  channelKey,
  isReadByEveryone,
  isReplyTarget,
  isHighlighted,
  isRevealed,
  replyTo,
  replyPreview,
  onOpenCompiler,
  onDelete,
  onReply,
  onReveal,
  onJumpToReply,
}: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const longPress = useLongPress({ onLongPress: onReveal });

  useEffect(() => {
    if (!isHighlighted) return;
    rowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isHighlighted]);

  return (
    <div
      ref={rowRef}
      data-message-id={message.id}
      className={`flex flex-col group/msg ${isOwn ? "items-end" : "items-start"}`}
    >
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
        {...longPress}
        className={`p-3 rounded-lg max-w-full lg:max-w-[85%] text-sm relative group border transition-shadow ${
          isOwn ? "bg-accent-soft border-accent/30 text-ink" : "bg-surface border-edge text-ink"
        } ${isReplyTarget ? "ring-1 ring-accent/50" : ""} ${
          isHighlighted ? "animate-reply-flash" : ""
        }`}
      >
        <button
          type="button"
          onClick={onReply}
          className="absolute -top-2 -left-2 bg-surface hover:bg-accent hover:text-white text-muted border border-edge hover:border-accent rounded-full w-5 h-5 flex items-center justify-center hover-reveal-pinned transition-all shadow"
          title="Reply to this message"
        >
          <ReplyIcon />
        </button>

        {replyTo && (
          <button
            type="button"
            onClick={onJumpToReply}
            className="w-full text-left mb-2 pl-2 border-l-2 border-accent/60 hover:border-accent transition-colors cursor-pointer"
            title="Jump to the original message"
          >
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wide text-accent">
              Reply to @{replyTo.sender}
            </span>
            <span className="block text-xs text-muted truncate mt-0.5">
              {replyPreview}
            </span>
          </button>
        )}

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
            data-revealed={isRevealed}
            className="absolute -top-2 -right-2 bg-accent hover:bg-accent-hover text-white text-[10px] px-1.5 py-0.5 rounded-full hover-reveal transition-opacity shadow"
            title="Delete message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
