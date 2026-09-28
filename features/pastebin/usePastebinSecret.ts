"use client";

import { useCallback, useState } from "react";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { encryptSecret } from "@/lib/crypto/secretCipher";
import { playWhooshSound } from "@/lib/audio/sfx";

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

    if (!originalText.trim()) {
      alert("Please enter some text or code first!");
      return;
    }
    if (requirePasscode && !passcode.trim()) {
      alert("Please enter a decryption passcode first!");
      return;
    }

    setIsLoading(true);

    if (requirePasscode) {
      setIsMasking(true);
      await maskText(originalText);
    }

    setIsFlying(true);
    playWhooshSound();

    const secretId = createSecretId();
    const payload: Record<string, unknown> = { createdAt: Date.now() };

    if (requirePasscode) {
      const sealed = await encryptSecret(originalText, passcode);
      payload.sealed = true;
      payload.ciphertext = sealed.ciphertext;
      payload.salt = sealed.salt;
      payload.iv = sealed.iv;
    } else {
      payload.text = originalText;
    }

    const maxViewsLimit = parseInt(maxViews, 10);
    if (!Number.isNaN(maxViewsLimit) && maxViewsLimit >= 1) {
      payload.maxViews = maxViewsLimit;
    }

    await set(ref(db, DB_PATHS.secret(secretId)), payload);
    setIsLoading(false);

    setTimeout(() => {
      setShareableLink(`${window.location.origin}/s/${secretId}`);
      setIsFlying(false);
      setIsMasking(false);
    }, LINK_READY_DELAY_MS);
  }, [maskText, maxViews, passcode, requirePasscode, setIsFlying, text]);

  const clearLink = useCallback(() => setShareableLink(""), []);

  return { isLoading, isMasking, shareableLink, generate, clearLink };
}
