"use client";

import { useEffect, useMemo, useRef } from "react";
import GroupMessageItem from "./GroupMessageItem";
import { REPLY_TARGET_MISSING, describeMessageForReply, truncateForPreview } from "@/lib/types";
import type { GroupMessage } from "@/lib/types";

interface Props {
  messages: GroupMessage[];
  username: string;
  channelKey: CryptoKey | null;
  typingUsers: string[];
  replyTargetId: string | null;
  highlightedId: string | null;
  onOpenCompiler: (code: string, language: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReply: (message: GroupMessage) => void;
  onJumpToMessage: (messageId: string) => void;
  isReadByEveryone: (message: GroupMessage) => boolean;
}

function formatTypingLabel(typingUsers: string[]): string {
  if (typingUsers.length === 1) return `@${typingUsers[0]} is typing…`;
  if (typingUsers.length === 2) return `@${typingUsers[0]} and @${typingUsers[1]} are typing…`;
  return `${typingUsers.length} people are typing…`;
}

export default function GroupMessageList({
  messages,
  username,
  channelKey,
  typingUsers,
  replyTargetId,
  highlightedId,
  onOpenCompiler,
  onDeleteMessage,
  onReply,
  onJumpToMessage,
  isReadByEveryone,
}: Props) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const messagesById = useMemo(() => {
    const lookup = new Map<string, GroupMessage>();
    for (const message of messages) lookup.set(message.id, message);
    return lookup;
  }, [messages]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="h-[55vh] md:h-[520px] bg-surface2/60 border border-edge rounded-lg p-4 overflow-y-auto space-y-3">
      {messages.length === 0 ? (
        <div className="text-center text-muted pt-24 text-sm">
          No messages in this workspace yet. Send the first update!
        </div>
      ) : (
        messages.map((message) => {
          const replyParent = message.replyTo ? messagesById.get(message.replyTo.id) : undefined;

          return (
            <GroupMessageItem
              key={message.id}
              message={message}
              isOwn={message.sender === username}
              channelKey={channelKey}
              isReadByEveryone={isReadByEveryone(message)}
              isReplyTarget={!!replyTargetId && replyTargetId === message.id}
              isHighlighted={!!highlightedId && highlightedId === message.id}
              replyTo={message.replyTo}
              replyPreview={
                message.replyTo
                  ? truncateForPreview(
                      replyParent ? describeMessageForReply(replyParent) : REPLY_TARGET_MISSING,
                      90,
                    )
                  : undefined
              }
              onOpenCompiler={onOpenCompiler}
              onDelete={() => onDeleteMessage(message.id)}
              onReply={() => onReply(message)}
              onJumpToReply={() => {
                if (replyParent) onJumpToMessage(replyParent.id);
              }}
            />
          );
        })
      )}
      {typingUsers.length > 0 && (
        <div className="flex items-center gap-2 pt-0.5" role="status" aria-live="polite">
          <span className="flex shrink-0 items-center gap-1 rounded-lg border border-edge bg-surface px-3 py-2.5">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-muted animate-typing-dot"
                style={{ animationDelay: `${dot * 140}ms` }}
              />
            ))}
          </span>
          <span className="truncate text-xs text-muted">{formatTypingLabel(typingUsers)}</span>
        </div>
      )}
      <div ref={scrollAnchorRef} />
    </div>
  );
}
