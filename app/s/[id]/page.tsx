"use client";
import { useState, useEffect, use } from "react";
import { ref, get, remove, runTransaction } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { playExplosionSound } from "@/lib/audio/sfx";
import { speakText } from "@/lib/speech/tts";
import { decryptSecret } from "@/lib/crypto/secretCipher";
import MatrixRain from "@/components/animations/MatrixRain";
import DetonationEffect from "@/components/animations/DetonationEffect";
import CompilerStudio from "@/components/popups/CompilerStudio";
import RenderContent from "@/components/ui/RenderContent";
import Link from "next/link";
import { SecretData } from "@/types";

export default function SharedSecret({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params); const { id } = unwrappedParams;
  const [secretData, setSecretData] = useState<SecretData | null>(null);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState("");
  const [decryptedText, setDecryptedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [viewCount, setViewCount] = useState<number>(0);
  const [viewLimit, setViewLimit] = useState<number | null>(null);
  const [isAutoBurned, setIsAutoBurned] = useState(false);
  const [isDestroyed, setIsDestroyed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [isDetonating, setIsDetonating] = useState(false);
  const [encryptedDisplay, setEncryptedDisplay] = useState("AWAITING_DECRYPTION_KEY...");

  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerPayload, setCompilerPayload] = useState({ code: "", lang: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dataRef = ref(db, `pastebin/${id}`);
        const snapshot = await get(dataRef);
        if (!snapshot.exists()) { if (!cancelled) setError("Secret not found. It may have been destroyed."); return; }
        const data = snapshot.val() as SecretData;
        if (cancelled) return;
        setViewCount(data.views ?? 0);
        setViewLimit(data.maxViews ?? null);
        if (data.maxViews) {
          const result = await runTransaction(dataRef, (current) => {
            if (current === null) return null;
            return { ...current, views: (current.views ?? 0) + 1 };
          });
          if (result.committed && result.snapshot.exists()) {
            const v = result.snapshot.val().views ?? 0;
            if (!cancelled) setViewCount(v);
            if (v >= data.maxViews) {
              await remove(dataRef);
              if (!cancelled) setIsAutoBurned(true);
            }
          }
        }
        if (cancelled) return;
        setSecretData(data);
        if (!data.sealed) setIsUnlocked(true);
      } catch {
        if (!cancelled) setError("Error connecting to database.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (secretData?.sealed && !isUnlocked) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
      const interval = setInterval(() => { let rand = ""; for (let i = 0; i < 24; i++) rand += chars[Math.floor(Math.random() * chars.length)]; setEncryptedDisplay(rand); }, 50);
      return () => clearInterval(interval);
    }
  }, [secretData, isUnlocked]);

  const triggerDestruction = async () => {
    setIsDetonating(true); await remove(ref(db, `pastebin/${id}`));
    const timer = setInterval(() => { setCountdown((prev) => { if (prev <= 1) { clearInterval(timer); playExplosionSound(); setIsDestroyed(true); return 0; } return prev - 1; }); }, 1000);
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretData || !secretData.sealed) return;
    if (!passcode.trim()) { alert("Enter the decryption passcode first!"); return; }
    setIsDecrypting(true);
    try {
      const plain = await decryptSecret({ ciphertext: secretData.ciphertext!, salt: secretData.salt!, iv: secretData.iv! }, passcode);
      setDecryptedText(plain);
      setIsUnlocked(true);
    } catch {
      alert("Incorrect passcode!");
      setPasscode("");
    } finally {
      setIsDecrypting(false);
    }
  };

  const payloadText = secretData?.sealed ? decryptedText : (secretData?.text ?? "");

  if (isLoading) return <div className="min-h-screen bg-bg flex items-center justify-center text-accent font-mono"><p className="animate-pulse text-sm">DECRYPTING SECURE CHANNEL...</p></div>;
  if (error || !secretData) return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface border border-accent/40 p-8 rounded-xl shadow-sm text-center">
        <h1 className="text-2xl font-bold text-accent mb-2">ACCESS DENIED</h1>
        <p className="text-muted font-mono text-sm break-words">{error}</p>
        <Link href="/" className="inline-block mt-6 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors">Back to OK-Share</Link>
      </div>
    </div>
  );
  if (isDestroyed) return <DetonationEffect />;

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <CompilerStudio isOpen={isCompilerOpen} onClose={() => setIsCompilerOpen(false)} initialCode={compilerPayload.code} initialLang={compilerPayload.lang} />
      <MatrixRain isVisible={!isUnlocked} />

      <div className={`w-full max-w-3xl bg-surface border rounded-xl p-5 sm:p-8 shadow-sm z-10 transition-all duration-500 ${!isUnlocked ? "border-accent/50" : "border-edge"}`}>
        {viewLimit !== null && (
          <div className="flex justify-center mb-4">
            <span className={`inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border ${isAutoBurned ? "text-accent border-accent/50 bg-accent/10" : "text-muted border-edge bg-surface2"}`}>
              <span>OPENED {viewCount}/{viewLimit}</span>
              {isAutoBurned && <span className="text-accent font-bold">· AUTO-BURNED</span>}
            </span>
          </div>
        )}
        {!isUnlocked ? (
          <form onSubmit={handleDecrypt} className="space-y-6 text-center relative z-20">
            <h1 className="text-xl sm:text-2xl font-bold text-accent">Protected Secret</h1>
            <p className="text-muted text-sm">Enter the decryption passcode to view the payload.</p>
            <div className="bg-code border border-edge2 p-4 rounded-lg overflow-hidden"><span className="text-ok font-mono text-sm tracking-widest break-all">{encryptedDisplay}</span></div>
            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Enter Passcode..." className="w-full rounded-md p-3 text-center text-sm font-mono" />
            <button type="submit" disabled={isDecrypting} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3 rounded-md transition-colors">{isDecrypting ? "DECRYPTING..." : "DECRYPT"}</button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-ok">Payload Decrypted</h2>
                <button onClick={() => speakText(payloadText)} className="inline-flex items-center gap-1.5 bg-surface2 hover:bg-edge text-xs px-3 py-1.5 rounded-md text-ink border border-edge transition-colors font-semibold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                  Read
                </button>
              </div>
              {isDetonating && <span className="text-accent font-black text-xl">00:0{countdown}</span>}
            </div>
            <div className="w-full bg-code border border-edge rounded-lg p-4 sm:p-6 relative overflow-hidden text-sm">
              <div className="relative z-10 max-w-none text-code-ink"><RenderContent content={payloadText} onOpenCompiler={(code, lang) => { setCompilerPayload({ code, lang }); setIsCompilerOpen(true); }} isReceiver /></div>
              {isDetonating && <div className="absolute inset-0 bg-accent/20 mix-blend-overlay pointer-events-none animate-pulse"></div>}
            </div>
            {isAutoBurned ? (
              <div className="w-full bg-surface2 border border-accent/40 text-accent font-bold py-4 rounded-md mt-4 text-center text-sm">AUTO-BURNED · THIS LINK IS DESTROYED</div>
            ) : (
              <button onClick={triggerDestruction} disabled={isDetonating} className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold py-4 rounded-md mt-4 transition-all">
                {isDetonating ? "INCINERATING..." : "BURN AFTER READING"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}