"use client";

import { useState } from "react";
import Link from "next/link";
import MatrixRain from "@/components/animations/MatrixRain";
import DetonationEffect from "@/components/animations/DetonationEffect";
import CompilerDialog from "@/features/compiler/CompilerDialog";
import BurnControls from "./BurnControls";
import SecretPasscodeGate from "./SecretPasscodeGate";
import SecretPayload from "./SecretPayload";
import { useBurnSequence } from "./useBurnSequence";
import { useSharedSecret } from "./useSharedSecret";
import useScrambleText from "@/lib/useScrambleText";

interface Props {
  secretId: string;
}

export default function SharedSecretView({ secretId }: Props) {
  const [passcode, setPasscode] = useState("");
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerPayload, setCompilerPayload] = useState({ code: "", language: "" });

  const {
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
  } = useSharedSecret(secretId);

  const burn = useBurnSequence(secretId);

  const encryptedDisplay = useScrambleText(
    Boolean(secret?.sealed) && !isUnlocked,
    24,
    "AWAITING_DECRYPTION_KEY...",
  );

  const payloadText = secret?.sealed ? decryptedText : (secret?.text ?? "");

  const openCompiler = (code: string, language: string) => {
    setCompilerPayload({ code, language });
    setIsCompilerOpen(true);
  };

  const handleDecrypt = async () => {
    const outcome = await decrypt(passcode);
    if (outcome === "wrong-passcode") setPasscode("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-accent font-mono">
        <p className="animate-pulse text-sm">DECRYPTING SECURE CHANNEL...</p>
      </div>
    );
  }

  if (error || !secret) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface border border-accent/40 p-8 rounded-xl shadow-sm text-center">
          <h1 className="text-2xl font-bold text-accent mb-2">ACCESS DENIED</h1>
          <p className="text-muted font-mono text-sm break-words">{error}</p>
          <Link
            href="/"
            className="inline-block mt-6 bg-accent hover:bg-accent-hover text-white font-semibold py-2 px-5 rounded-md text-sm transition-colors"
          >
            Back to OK-Share
          </Link>
        </div>
      </div>
    );
  }

  if (burn.isDestroyed) return <DetonationEffect />;

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <CompilerDialog
        isOpen={isCompilerOpen}
        onClose={() => setIsCompilerOpen(false)}
        initialCode={compilerPayload.code}
        initialLanguage={compilerPayload.language}
      />
      <MatrixRain isVisible={!isUnlocked} />

      <div
        className={`w-full max-w-3xl bg-surface border rounded-xl p-5 sm:p-8 shadow-sm z-10 transition-all duration-500 ${!isUnlocked ? "border-accent/50" : "border-edge"}`}
      >
        {viewLimit !== null && (
          <div className="flex justify-center mb-4">
            <span
              className={`inline-flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border ${isAutoBurned ? "text-accent border-accent/50 bg-accent/10" : "text-muted border-edge bg-surface2"}`}
            >
              <span>
                OPENED {viewCount}/{viewLimit}
              </span>
              {isAutoBurned && <span className="text-accent font-bold">· AUTO-BURNED</span>}
            </span>
          </div>
        )}

        {!isUnlocked ? (
          <SecretPasscodeGate
            encryptedDisplay={encryptedDisplay}
            passcode={passcode}
            isDecrypting={isDecrypting}
            onPasscodeChange={setPasscode}
            onSubmit={handleDecrypt}
          />
        ) : (
          <>
            <SecretPayload
              payloadText={payloadText}
              isDetonating={burn.isDetonating}
              countdown={burn.countdown}
              onOpenCompiler={openCompiler}
            />
            <BurnControls
              isLoading={isLoading}
              isAutoBurned={isAutoBurned}
              isDetonating={burn.isDetonating}
              onBurn={burn.triggerDestruction}
            />
          </>
        )}
      </div>
    </main>
  );
}
