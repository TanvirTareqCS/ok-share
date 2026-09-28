"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
const TICK_MS = 50;

function randomGlyphs(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return result;
}

export default function useScrambleText(isActive: boolean, length: number, seed: string) {
  const [display, setDisplay] = useState(seed);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => setDisplay(randomGlyphs(length)), TICK_MS);
    return () => clearInterval(interval);
  }, [isActive, length]);

  return display;
}
