"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ref, remove, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import type { GroupMessage } from "@/lib/types";

const TYPING_DEBOUNCE_MS = 1800;
const TYPING_STALE_MS = 3000;
const READ_RECEIPT_DEBOUNCE_MS = 1500;

interface Args {
  username: string;
  groupName: string;
  messages: GroupMessage[];
  members: string[];
  lastReadBy: Record<string, number>;
  typingMap: Record<string, number>;
}

export interface GroupPresence {
  typingUsers: string[];
  unreadCount: number;
  notifyTyping: () => void;
  stopTyping: () => void;
  hasReadByEveryone: (message: GroupMessage) => boolean;
}

export function useGroupPresence({
  username,
  groupName,
  messages,
  members,
  lastReadBy,
  typingMap,
}: Args): GroupPresence {
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (groupName && username) {
      remove(ref(db, DB_PATHS.typingIndicator(groupName, username)));
    }
  }, [groupName, username]);

  const notifyTyping = useCallback(() => {
    if (!groupName || !username) return;

    set(ref(db, DB_PATHS.typingIndicator(groupName, username)), Date.now());

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, TYPING_DEBOUNCE_MS);
  }, [groupName, stopTyping, username]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (groupName && username) {
        remove(ref(db, DB_PATHS.typingIndicator(groupName, username)));
      }
    };
  }, [groupName, username]);

  useEffect(() => {
    if (!groupName || !username || messages.length === 0) return;

    const myLastRead = lastReadBy[username] ?? 0;
    const hasUnread = messages.some(
      (message) => message.sender !== username && message.timestamp > myLastRead,
    );
    if (!hasUnread) return;

    const receiptTimer = setTimeout(() => {
      set(ref(db, DB_PATHS.lastReadReceipt(groupName, username)), Date.now());
    }, READ_RECEIPT_DEBOUNCE_MS);

    return () => clearTimeout(receiptTimer);
  }, [groupName, username, messages, lastReadBy]);

  const typingUsers = useMemo(() => resolveActiveTypers(typingMap, username), [typingMap, username]);

  const hasReadByEveryone = useCallback(
    (message: GroupMessage) => {
      const others = members.filter((member) => member !== username);
      return (
        others.length > 0 && others.every((member) => (lastReadBy[member] ?? 0) >= message.timestamp)
      );
    },
    [lastReadBy, members, username],
  );

  const unreadCount = messages.filter(
    (message) => message.sender !== username && message.timestamp > (lastReadBy[username] ?? 0),
  ).length;

  return { typingUsers, unreadCount, notifyTyping, stopTyping, hasReadByEveryone };
}

export function resolveActiveTypers(typingMap: Record<string, number>, username: string): string[] {
  const now = Date.now();
  return Object.keys(typingMap).filter(
    (user) => user !== username && now - (typingMap[user] ?? 0) < TYPING_STALE_MS,
  );
}
