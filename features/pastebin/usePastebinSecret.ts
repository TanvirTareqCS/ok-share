"use client";

import { useCallback, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import {
  bufferToBase64,
  createChannelCheck,
  deriveChannelKey,
  encryptSecret,
  generateSalt,
} from "@/lib/crypto/secretCipher";
import { FILE_CAP_BYTES, MAX_COMBINED_FILE_BYTES, sealBytesWithPin } from "@/lib/crypto/fileCipher";
import { playWhooshSound } from "@/lib/audio/sfx";
import type { AttachmentDraft, SharedSecret } from "@/lib/types";

const SECRET_ID_LENGTH = 10;
const LINK_READY_DELAY_MS = 1000;
const MASK_TICK_MS = 30;
const MASK_SETTLE_MS = 600;
const MASK_STEPS = 15;

export interface PastebinDraft {
  text: string;
  setText: React.Dispatch<React.SetStateAction<string>>;
  passcode: string;
  maxViews: string;
  requirePasscode: boolean;
  files: AttachmentDraft[];
  setIsFlying: (value: boolean) => void;
}

export interface PastebinGenerator {
  isLoading: boolean;
  isMasking: boolean;
  shareableLink: string;
  generate: () => Promise<void>;
  clearLink: () => void;
}

function createSecretId(): string {
  return Math.random().toString(36).substring(2, 2 + SECRET_ID_LENGTH);
}

export function usePastebinSecret({
  text,
  setText,
  passcode,
  maxViews,
  requirePasscode,
  files,
  setIsFlying,
}: PastebinDraft): PastebinGenerator {
  const [isLoading, setIsLoading] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  const maskText = useCallback(
    (originalText: string) =>
      new Promise<void>((resolve) => {
        let cursor = 0;
        const maskInterval = setInterval(() => {
          cursor += Math.max(1, Math.floor(originalText.length / MASK_STEPS));
          if (cursor >= originalText.length) {
            setText("*".repeat(originalText.length));
            clearInterval(maskInterval);
            return;
          }
          setText("*".repeat(cursor) + originalText.slice(cursor));
        }, MASK_TICK_MS);

        setTimeout(resolve, MASK_SETTLE_MS);
      }),
    [setText],
  );

  const generate = useCallback(async () => {
    const originalText = text;
    const hasFiles = files.length > 0;
    const trimmedPasscode = passcode.trim();
    const pin = requirePasscode && trimmedPasscode ? trimmedPasscode : "";
    const isSealed = requirePasscode;

    if (!originalText.trim() && !hasFiles) {
      alert("Please enter some text, code, or attach a file first!");
      return;
    }
    if (requirePasscode && !trimmedPasscode) {
      alert("Please enter a decryption passcode first!");
      return;
    }
    if (hasFiles) {
      const totalBytes = files.reduce((sum, file) => sum + file.file.size, 0);
      if (totalBytes > MAX_COMBINED_FILE_BYTES) {
        alert("Files in one share must total under 8 MB.");
        return;
      }
      for (const file of files) {
        if (file.file.size > FILE_CAP_BYTES) {
          alert(`"${file.name}" exceeds the 5 MB file limit.`);
          return;
        }
      }
    }

    setIsLoading(true);

    if (isSealed && originalText.trim()) {
      setIsMasking(true);
      await maskText(originalText);
    }

    const secretId = createSecretId();
    const payload: Partial<SharedSecret> = { createdAt: Date.now() };

    if (isSealed && pin) {
      payload.sealed = true;

      if (originalText.trim()) {
        const sealed = await encryptSecret(originalText, pin);
        payload.ciphertext = sealed.ciphertext;
        payload.salt = sealed.salt;
        payload.iv = sealed.iv;
      }

      const checkSalt = generateSalt();
      const checkKey = await deriveChannelKey(pin, checkSalt);
      payload.check = await createChannelCheck(checkKey);
      payload.checkSalt = checkSalt;

      if (hasFiles) {
        const sealedFiles = await Promise.all(
          files.map(async (draft) => ({
            name: draft.name,
            size: draft.size,
            kind: draft.kind,
            ...(await sealBytesWithPin(await draft.file.arrayBuffer(), pin)),
          })),
        );
        payload.files = sealedFiles;
      }
    } else {
      payload.text = originalText;

      if (hasFiles) {
        const rawFiles = await Promise.all(
          files.map(async (draft) => ({
            name: draft.name,
            size: draft.size,
            kind: draft.kind,
            data: bufferToBase64(await draft.file.arrayBuffer()),
          })),
        );
        payload.files = rawFiles;
      }
    }

    const maxViewsLimit = parseInt(maxViews, 10);
    if (!Number.isNaN(maxViewsLimit) && maxViewsLimit >= 1) {
      payload.maxViews = maxViewsLimit;
    }

    setIsFlying(true);
    playWhooshSound();

    await set(ref(db, DB_PATHS.secret(secretId)), payload);
    setIsLoading(false);

    setTimeout(() => {
      setShareableLink(`${window.location.origin}/s/${secretId}`);
      setIsFlying(false);
      setIsMasking(false);
    }, LINK_READY_DELAY_MS);
  }, [files, maskText, maxViews, passcode, requirePasscode, setIsFlying, text]);

  const clearLink = useCallback(() => setShareableLink(""), []);

  return { isLoading, isMasking, shareableLink, generate, clearLink };
}