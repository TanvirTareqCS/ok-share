"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ref, remove } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { playExplosionSound } from "@/lib/audio/sfx";

const COUNTDOWN_FROM = 3;
const COUNTDOWN_INTERVAL_MS = 1000;

export interface BurnSequence {
  isDetonating: boolean;
  isDestroyed: boolean;
  countdown: number;
  triggerDestruction: () => void;
}

export function useBurnSequence(secretId: string): BurnSequence {
  const [isDetonating, setIsDetonating] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const triggerDestruction = useCallback(() => {
    setIsDetonating(true);
    remove(ref(db, DB_PATHS.secret(secretId)));

    timerRef.current = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          playExplosionSound();
          setIsDestroyed(true);
          return 0;
        }
        return previous - 1;
      });
    }, COUNTDOWN_INTERVAL_MS);
  }, [secretId]);

  return { isDetonating, isDestroyed, countdown, triggerDestruction };
}
