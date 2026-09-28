"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { get, onValue, push, ref, remove, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { deriveChannelKey, openWithKey, sealWithKey } from "@/lib/crypto/secretCipher";
import type { GroupMessage } from "@/lib/types";

interface Args {
  username: string;
  groupName: string;
  onGroupClosed: () => void;
}

export interface GroupChannel {
  members: string[];
  messages: GroupMessage[];
  lastReadBy: Record<string, number>;
  typingMap: Record<string, number>;
  isSealed: boolean;
  channelKey: CryptoKey | null;
  needsPassphrase: boolean;
  isSending: boolean;
  leaveLocal: () => void;
  leaveGroup: () => Promise<void>;
  unlock: (passphrase: string) => Promise<boolean>;
  sendMessage: (text: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export function useGroupChannel({ username, groupName, onGroupClosed }: Args): GroupChannel {
  const [members, setMembers] = useState<string[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [lastReadBy, setLastReadBy] = useState<Record<string, number>>({});
  const [typingMap, setTypingMap] = useState<Record<string, number>>({});
  const [isSealed, setIsSealed] = useState(false);
  const [channelKey, setChannelKey] = useState<CryptoKey | null>(null);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const channelKeyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef("");

  const applyChannelKey = useCallback((key: CryptoKey | null) => {
    channelKeyRef.current = key;
    setChannelKey(key);
  }, []);

  const leaveLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.activeGroup);
    setMessages([]);
    setMembers([]);
    setLastReadBy({});
    setTypingMap({});
    setNeedsPassphrase(false);
    applyChannelKey(null);
    setIsSealed(false);
    saltRef.current = "";
    onGroupClosed();
  }, [applyChannelKey, onGroupClosed]);

  useEffect(() => {
    if (!groupName || !username) return;

    const unsubscribeMeta = onValue(ref(db, DB_PATHS.groupMeta(groupName)), (snapshot) => {
      if (!snapshot.exists()) {
        alert("Group was deleted.");
        leaveLocal();
        return;
      }

      const data = snapshot.val();
      if (data.creator !== username && !data.members?.includes(username)) {
        alert("Removed from group.");
        leaveLocal();
        return;
      }

      setMembers([data.creator, ...(data.members || [])]);
      setLastReadBy(data.lastRead || {});
      setTypingMap(data.typing || {});
      setIsSealed(!!data.sealed);
      if (typeof data.salt === "string") saltRef.current = data.salt;

      if (data.sealed && !channelKeyRef.current) {
        const stored = localStorage.getItem(STORAGE_KEYS.groupPassphrase(groupName));
        if (!stored) {
          setNeedsPassphrase(true);
          return;
        }
        deriveChannelKey(stored, data.salt)
          .then((key) => {
            applyChannelKey(key);
            setNeedsPassphrase(false);
          })
          .catch(() => setNeedsPassphrase(true));
      }
    });

    return () => unsubscribeMeta();
  }, [groupName, username, applyChannelKey, leaveLocal]);

  useEffect(() => {
    if (!groupName || !username) return;

    const unsubscribeMessages = onValue(
      ref(db, DB_PATHS.groupMessages(groupName)),
      async (snapshot) => {
        if (!snapshot.exists()) {
          setMessages([]);
          return;
        }

        const raw: GroupMessage[] = [];
        snapshot.forEach((child) => {
          raw.push({ id: child.key as string, ...child.val() });
        });

        const key = channelKeyRef.current;
        const decrypted = await Promise.all(
          raw.map(async (message) => {
            if (!message.sealed || !key) return message;
            try {
              const text = await openWithKey(key, {
                ciphertext: message.ciphertext as string,
                iv: message.iv as string,
              });
              return { ...message, text };
            } catch {
              return { ...message, text: "[cannot decrypt]" };
            }
          }),
        );

        setMessages(decrypted);
      },
    );

    return () => unsubscribeMessages();
  }, [groupName, username]);

  const unlock = useCallback(
    async (passphrase: string) => {
      const trimmed = passphrase.trim();
      if (!saltRef.current || !trimmed) {
        alert("Enter the channel passphrase first!");
        return false;
      }

      try {
        const key = await deriveChannelKey(trimmed, saltRef.current);
        localStorage.setItem(STORAGE_KEYS.groupPassphrase(groupName), trimmed);
        applyChannelKey(key);
        setNeedsPassphrase(false);
        return true;
      } catch {
        alert("Could not unlock with that passphrase.");
        return false;
      }
    },
    [applyChannelKey, groupName],
  );

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || !groupName) return false;

      if (isSealed && !channelKeyRef.current) {
        alert("Unlock the channel passphrase first!");
        return false;
      }

      setIsSending(true);
      try {
        const messagesRef = ref(db, DB_PATHS.groupMessages(groupName));

        if (isSealed && channelKeyRef.current) {
          const sealed = await sealWithKey(channelKeyRef.current, text);
          await push(messagesRef, {
            sender: username,
            ...sealed,
            sealed: true,
            timestamp: Date.now(),
          });
        } else {
          await push(messagesRef, { sender: username, text, timestamp: Date.now() });
        }

        return true;
      } finally {
        setIsSending(false);
      }
    },
    [groupName, isSealed, username],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      await remove(ref(db, DB_PATHS.groupMessage(groupName, messageId)));
    },
    [groupName],
  );

  const leaveGroup = useCallback(async () => {
    if (!confirm("Are you sure you want to leave this channel?")) return;

    const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(groupName)));
    if (metaSnapshot.exists()) {
      const meta = metaSnapshot.val();

      if (meta.creator === username) {
        if (meta.members?.length > 0) {
          await set(ref(db, DB_PATHS.groupMeta(groupName)), {
            ...meta,
            creator: meta.members[0],
            members: meta.members.slice(1),
          });
        } else {
          await remove(ref(db, DB_PATHS.group(groupName)));
        }
      } else {
        await set(
          ref(db, DB_PATHS.groupMembers(groupName)),
          meta.members.filter((member: string) => member !== username),
        );
      }
    }

    leaveLocal();
  }, [groupName, leaveLocal, username]);

  return {
    members,
    messages,
    lastReadBy,
    typingMap,
    isSealed,
    channelKey,
    needsPassphrase,
    isSending,
    leaveLocal,
    leaveGroup,
    unlock,
    sendMessage,
    deleteMessage,
  };
}
