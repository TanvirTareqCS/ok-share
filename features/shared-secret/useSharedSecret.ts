"use client";

import { useEffect, useRef, useState } from "react";
import { get, ref, remove, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { decryptSecret } from "@/lib/crypto/secretCipher";
import type { SharedSecret } from "@/lib/types";

const CONNECTION_ERROR = "Error connecting to database.";
const NOT_FOUND_ERROR = "Secret not found. It may have been destroyed.";

export type DecryptOutcome = "unlocked" | "wrong-passcode" | "ignored";

export interface SharedSecretState {
  secret: SharedSecret | null;
  isLoading: boolean;
  error: string;
  viewCount: number;
  viewLimit: number | null;
  isAutoBurned: boolean;
  isDecrypting: boolean;
  decryptedText: string;
  isUnlocked: boolean;
  decrypt: (passcode: string) => Promise<DecryptOutcome>;
}

export function useSharedSecret(secretId: string): SharedSecretState {
  const [secret, setSecret] = useState<SharedSecret | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const [viewLimit, setViewLimit] = useState<number | null>(null);
  const [isAutoBurned, setIsAutoBurned] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const secretRef = useRef<SharedSecret | null>(null);

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const secretRefPath = ref(db, DB_PATHS.secret(secretId));
        const snapshot = await get(secretRefPath);

        if (!snapshot.exists()) {
          if (!isCancelled) setError(NOT_FOUND_ERROR);
          return;
        }

        const data = snapshot.val() as SharedSecret;
        if (isCancelled) return;

        setViewCount(data.views ?? 0);
        setViewLimit(data.maxViews ?? null);

        if (data.maxViews) {
          const result = await runTransaction(secretRefPath, (current) => {
            if (current === null) return null;
            return { ...current, views: (current.views ?? 0) + 1 };
          });

          if (result.committed && result.snapshot.exists()) {
            const views = result.snapshot.val().views ?? 0;
            if (!isCancelled) setViewCount(views);

            if (views >= data.maxViews) {
              await remove(secretRefPath);
              if (!isCancelled) setIsAutoBurned(true);
            }
          }
        }

        if (isCancelled) return;

        secretRef.current = data;
        setSecret(data);
        if (!data.sealed) setIsUnlocked(true);
      } catch {
        if (!isCancelled) setError(CONNECTION_ERROR);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [secretId]);

  const decrypt = async (passcode: string): Promise<DecryptOutcome> => {
    const current = secretRef.current;
    if (!current?.sealed) return "ignored";

    if (!passcode.trim()) {
      alert("Enter the decryption passcode first!");
      return "ignored";
    }

    setIsDecrypting(true);
    try {
      const plaintext = await decryptSecret(
        {
          ciphertext: current.ciphertext as string,
          salt: current.salt as string,
          iv: current.iv as string,
        },
        passcode,
      );
      setDecryptedText(plaintext);
      setIsUnlocked(true);
      return "unlocked";
    } catch {
      alert("Incorrect passcode!");
      return "wrong-passcode";
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    secret,
    isLoading,
    error,
    viewCount,
    viewLimit,
    isAutoBurned,
    isDecrypting,
    decryptedText,
    isUnlocked,
    decrypt,
  };
}
