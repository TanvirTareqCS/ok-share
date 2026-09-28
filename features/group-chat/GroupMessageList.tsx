"use client";

import { useEffect, useRef } from "react";
import GroupMessageItem from "./GroupMessageItem";
import type { GroupMessage } from "@/lib/types";

interface Props {
  messages: GroupMessage[];
  username: string;
  channelKey: CryptoKey | null;
  onOpenCompiler: (code: string, language: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isReadByEveryone: (message: GroupMessage) => boolean;
}

export default function GroupMessageList({
  messages,
  username,
  channelKey,
  onOpenCompiler,
  onDeleteMessage,
  isReadByEveryone,
}: Props) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-[55vh] md:h-[520px] bg-surface2/60 border border-edge rounded-lg p-4 overflow-y-auto space-y-3">
      {messages.length === 0 ? (
        <div className="text-center text-muted pt-24 text-sm">
          No messages in this workspace yet. Send the first update!
        </div>
      ) : (
        messages.map((message) => (
          <GroupMessageItem
            key={message.id}
            message={message}
            isOwn={message.sender === username}
            channelKey={channelKey}
            isReadByEveryone={isReadByEveryone(message)}
            onOpenCompiler={onOpenCompiler}
            onDelete={() => onDeleteMessage(message.id)}
          />
        ))
      )}
      <div ref={scrollAnchorRef} />
    </div>
  );
}