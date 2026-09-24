"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { encryptSecret } from "@/lib/crypto/secretCipher";
import { playWhooshSound } from "@/lib/audio/sfx";

interface Props { onOpenDictation: () => void; setIsFlying: (v: boolean) => void; requirePasscode: boolean; setRequirePasscode: (v: boolean) => void; text: string; setText: React.Dispatch<React.SetStateAction<string>>; }

export default function PastebinWorkspace({ onOpenDictation, setIsFlying, requirePasscode, setRequirePasscode, text, setText }: Props) {
  const [passcode, setPasscode] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [shareableLink, setShareableLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [encryptedDisplay, setEncryptedDisplay] = useState("SECURE_CIPHER_ACTIVE");

  useEffect(() => {
    if (requirePasscode) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => {
        let randomized = "";
        for (let i = 0; i < 14; i++) randomized += chars[Math.floor(Math.random() * chars.length)];
        setEncryptedDisplay(randomized);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [requirePasscode]);

  const handleGenerate = async () => {
    const originalText = text;
    if (!originalText.trim()) { alert("Please enter some text or code first!"); return; }
    if (requirePasscode && !passcode.trim()) { alert("Please enter a decryption passcode first!"); return; }
    setIsLoading(true);
    if (requirePasscode) {
      setIsMasking(true); let currentIndex = 0;
      const maskInterval = setInterval(() => {
        currentIndex += Math.max(1, Math.floor(originalText.length / 15));
        if (currentIndex >= originalText.length) { setText("*".repeat(originalText.length)); clearInterval(maskInterval); } 
        else setText("*".repeat(currentIndex) + originalText.slice(currentIndex));
      }, 30);
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setIsFlying(true); playWhooshSound();
    const id = Math.random().toString(36).substring(2, 10);
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
    const maxViewsInt = parseInt(maxViews, 10);
    if (!Number.isNaN(maxViewsInt) && maxViewsInt >= 1) payload.maxViews = maxViewsInt;
    await set(ref(db, `pastebin/${id}`), payload);
    setTimeout(() => { setShareableLink(`${window.location.origin}/s/${id}`); setIsFlying(false); setIsMasking(false); }, 1000);
    setIsLoading(false);
  };

  if (shareableLink) {
    return (
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface2/60 border border-ok/30 rounded-lg p-6 text-center space-y-4">
        <h2 className="text-lg font-bold text-ok">Link Generated Successfully</h2>
        <p className="text-sm text-muted">Share this link with your friend. It will remain until it is destroyed.</p>
        <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-code border border-edge2 rounded-lg p-2">
          <input type="text" readOnly value={shareableLink} className="flex-1 bg-transparent border-none text-ok font-mono text-sm focus:outline-none text-center sm:text-left" />
          <button onClick={() => { navigator.clipboard.writeText(shareableLink); alert("Link copied!"); }} className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap">
            Copy
          </button>
        </div>
        <button onClick={() => { setShareableLink(""); setText(""); setPasscode(""); setMaxViews(""); setRequirePasscode(false); }} className="text-sm text-muted hover:text-ink underline transition-colors pt-1 font-semibold">
          Create another secret
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="w-full mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-surface p-2 pl-3 border border-edge border-b-0 rounded-t-lg">
          <span className="text-xs font-semibold text-muted">Type or dictate your payload</span>
          <button type="button" onClick={onOpenDictation} className="inline-flex items-center justify-center gap-1.5 bg-surface2 text-ink text-xs font-semibold px-3 py-1.5 rounded-md border border-edge hover:border-edge2 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            Dictate
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isMasking}
          className="w-full h-72 sm:h-96 bg-code text-code-ink font-mono p-4 rounded-b-lg text-sm focus:outline-none resize-none disabled:opacity-80"
          placeholder={'Type normal text, or wrap code like this:\n\n\'\'\'python\'\'\'\nprint(\'Hello World\')\n\'\'\'/python\'\'\''}
        />
      </div>

      <AnimatePresence>
        {requirePasscode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden mb-4">
            <div className="bg-accent-soft border border-accent/40 rounded-lg p-4">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-accent tracking-wider">PASSCODE PROTECTED</span>
                <span className="text-xs font-mono text-ok">{encryptedDisplay}</span>
              </div>
              <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter decryption passcode..." className="w-full rounded-md p-3 text-center text-sm font-mono" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3 mt-2">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={requirePasscode} onChange={(e) => setRequirePasscode(e.target.checked)} className="h-4 w-4 rounded border-edge text-accent" />
            <span className="text-sm text-muted">Require passcode</span>
          </label>
          <label className="flex items-center gap-2 select-none text-sm text-muted">
            <span>Auto-burn after</span>
            <input type="number" min={1} value={maxViews} onChange={(e) => setMaxViews(e.target.value)} placeholder="∞" className="w-16 rounded-md p-2 text-center text-sm font-mono bg-surface2 border border-edge focus:outline-none focus:border-accent" />
            <span>view(s)</span>
          </label>
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full sm:w-auto sm:self-end">
          {isLoading ? "Generating..." : "Generate Link"}
        </button>
      </div>
    </>
  );
}