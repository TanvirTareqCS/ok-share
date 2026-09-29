"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { get, onValue, push, ref, remove, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { bufferToBase64, deriveChannelKey, openWithKey, sealWithKey, verifyChannelCheck } from "@/lib/crypto/secretCipher";
import { classifyFileName, FILE_CAP_BYTES, sealBytesWithKey } from "@/lib/crypto/fileCipher";
import type { SealedMessage } from "@/lib/crypto/secretCipher";
import { UNDECRYPTABLE_MARKER } from "@/lib/types";
import type { GroupMessage, MessageReplyRef } from "@/lib/types";

interface Args {
  username: string;
  groupName: string;
  onGroupClosed: () => void;
}

export interface GroupChannel {
  members: string[];
  admins: string[];
  messages: GroupMessage[];
  lastReadBy: Record<string, number>;
  typingMap: Record<string, number>;
  isSealed: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  channelKey: CryptoKey | null;
  needsPassphrase: boolean;
  isSending: boolean;
  leaveLocal: () => void;
  leaveGroup: () => Promise<void>;
  unlock: (passphrase: string) => Promise<boolean>;
  reenter: () => void;
  sendMessage: (text: string, file?: File | null, replyTo?: MessageReplyRef | null) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<void>;
}

export function useGroupChannel({ username, groupName, onGroupClosed }: Args): GroupChannel {
  const [members, setMembers] = useState<string[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [lastReadBy, setLastReadBy] = useState<Record<string, number>>({});
  const [typingMap, setTypingMap] = useState<Record<string, number>>({});
  const [isSealed, setIsSealed] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [channelKey, setChannelKey] = useState<CryptoKey | null>(null);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const channelKeyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef("");
  const checkRef = useRef<SealedMessage | null>(null);
  const sealedMessagesRef = useRef<SealedMessage[]>([]);
  const rawMessagesRef = useRef<GroupMessage[]>([]);
  const manualLockRef = useRef(false);

  const applyChannelKey = useCallback((key: CryptoKey | null) => {
    channelKeyRef.current = key;
    setChannelKey(key);
  }, []);

  const verifyKey = useCallback(async (key: CryptoKey): Promise<boolean> => {
    const check = checkRef.current;
    if (check) return verifyChannelCheck(key, check);

    for (const payload of sealedMessagesRef.current) {
      try {
        await openWithKey(key, payload);
        return true;
      } catch {
        // try the next sealed message
      }
    }
    return sealedMessagesRef.current.length === 0;
  }, []);

  const decryptRaw = useCallback(async (raw: GroupMessage[]) => {
    const key = channelKeyRef.current;
    const decrypted = await Promise.all(
      raw.map(async (message) => {
        if (!message.sealed || !key) return message;
        try {
          const text = message.ciphertext
            ? await openWithKey(key, {
                ciphertext: message.ciphertext as string,
                iv: message.iv as string,
              })
            : (message.text ?? "");
          return { ...message, text };
        } catch {
          return { ...message, text: UNDECRYPTABLE_MARKER };
        }
      }),
    );
    if (channelKeyRef.current === key) setMessages(decrypted);
  }, []);

  const leaveLocal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.activeGroup);
    setMessages([]);
    setMembers([]);
    setAdmins([]);
    setLastReadBy({});
    setTypingMap({});
    setNeedsPassphrase(false);
    applyChannelKey(null);
    setIsSealed(false);
    setIsCreator(false);
    setIsAdmin(false);
    saltRef.current = "";
    checkRef.current = null;
    sealedMessagesRef.current = [];
    rawMessagesRef.current = [];
    manualLockRef.current = false;
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
      setAdmins(data.admins || []);
      setLastReadBy(data.lastRead || {});
      setTypingMap(data.typing || {});
      setIsSealed(!!data.sealed);
      setIsCreator(data.creator === username);
      setIsAdmin(!!data.admins?.includes(username));
      if (typeof data.salt === "string") saltRef.current = data.salt;
      if (
        data.check &&
        typeof data.check.ciphertext === "string" &&
        typeof data.check.iv === "string"
      ) {
        checkRef.current = { ciphertext: data.check.ciphertext, iv: data.check.iv };
      }

      if (data.sealed && !channelKeyRef.current && !manualLockRef.current) {
        const stored = localStorage.getItem(STORAGE_KEYS.groupPassphrase(groupName));
        if (!stored) {
          setNeedsPassphrase(true);
          return;
        }
        deriveChannelKey(stored, data.salt)
          .then(async (key) => {
            if (await verifyKey(key)) {
              applyChannelKey(key);
              setNeedsPassphrase(false);
            } else {
              localStorage.removeItem(STORAGE_KEYS.groupPassphrase(groupName));
              setNeedsPassphrase(true);
            }
          })
          .catch(() => setNeedsPassphrase(true));
      }
    });

    return () => unsubscribeMeta();
  }, [groupName, username, applyChannelKey, leaveLocal, verifyKey]);

  useEffect(() => {
    if (!groupName || !username) return;

    const unsubscribeMessages = onValue(ref(db, DB_PATHS.groupMessages(groupName)), (snapshot) => {
      if (!snapshot.exists()) {
        rawMessagesRef.current = [];
        sealedMessagesRef.current = [];
        setMessages([]);
        return;
      }

      const raw: GroupMessage[] = [];
      snapshot.forEach((child) => {
        raw.push({ id: child.key as string, ...child.val() });
      });

      rawMessagesRef.current = raw;
      sealedMessagesRef.current = raw
        .filter((message) => message.sealed && typeof message.ciphertext === "string")
        .map((message) => ({
          ciphertext: message.ciphertext as string,
          iv: message.iv as string,
        }));

      decryptRaw(raw);
    });

    return () => unsubscribeMessages();
  }, [groupName, username, decryptRaw]);

  useEffect(() => {
    if (rawMessagesRef.current.length > 0) decryptRaw(rawMessagesRef.current);
  }, [channelKey, decryptRaw]);

  const unlock = useCallback(
    async (passphrase: string) => {
      const trimmed = passphrase.trim();
      if (!saltRef.current || !trimmed) {
        alert("Enter the channel passphrase first!");
        return false;
      }

      manualLockRef.current = true;
      try {
        const key = await deriveChannelKey(trimmed, saltRef.current);
        if (!(await verifyKey(key))) return false;
        manualLockRef.current = false;
        localStorage.setItem(STORAGE_KEYS.groupPassphrase(groupName), trimmed);
        applyChannelKey(key);
        setNeedsPassphrase(false);
        return true;
      } catch {
        alert("Could not unlock with that passphrase.");
        return false;
      }
    },
    [applyChannelKey, groupName, verifyKey],
  );

  const reenter = useCallback(() => {
    if (!isSealed) return;
    manualLockRef.current = true;
    applyChannelKey(null);
    setNeedsPassphrase(true);
  }, [applyChannelKey, isSealed]);

  const sendMessage = useCallback(
    async (rawText: string, file?: File | null, replyTo?: MessageReplyRef | null) => {
      const text = rawText.trim();
      if ((!text && !file) || !groupName) return false;

      if (isSealed && !channelKeyRef.current) {
        alert("Unlock the channel passphrase first!");
        return false;
      }

      if (file && file.size > FILE_CAP_BYTES) {
        alert(`"${file.name}" exceeds the 5 MB file limit.`);
        return false;
      }

      setIsSending(true);
      try {
        if (isSealed && channelKeyRef.current) {
          const messageRef = push(ref(db, DB_PATHS.groupMessages(groupName)));
          const payload: Record<string, unknown> = {
            sender: username,
            sealed: true,
            timestamp: Date.now(),
          };

          if (text) {
            const sealed = await sealWithKey(channelKeyRef.current, text);
            payload.ciphertext = sealed.ciphertext;
            payload.iv = sealed.iv;
          }

          if (file) {
            const bytes = await file.arrayBuffer();
            const sealedFile = await sealBytesWithKey(channelKeyRef.current, bytes);
            payload.attachment = {
              name: file.name,
              size: file.size,
              kind: classifyFileName(file.name),
              iv: sealedFile.iv,
              ciphertext: bufferToBase64(sealedFile.bytes),
            };
          }

          if (replyTo) {
            payload.replyTo = { id: replyTo.id, sender: replyTo.sender };
          }

          await set(messageRef, payload);
        } else {
          const payload: Record<string, unknown> = {
            sender: username,
            timestamp: Date.now(),
          };
          if (text) {
            payload.text = text;
          }
          if (file) {
            payload.attachment = {
              name: file.name,
              size: file.size,
              kind: classifyFileName(file.name),
              data: bufferToBase64(await file.arrayBuffer()),
            };
          }
          if (replyTo) {
            payload.replyTo = { id: replyTo.id, sender: replyTo.sender };
          }
          await push(ref(db, DB_PATHS.groupMessages(groupName)), payload);
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
    admins,
    messages,
    lastReadBy,
    typingMap,
    isSealed,
    isCreator,
    isAdmin,
    channelKey,
    needsPassphrase,
    isSending,
    leaveLocal,
    leaveGroup,
    unlock,
    reenter,
    sendMessage,
    deleteMessage,
  };
}
