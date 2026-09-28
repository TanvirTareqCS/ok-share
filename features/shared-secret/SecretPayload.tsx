"use client";

import { SpeakerIcon } from "@/components/icons/ActionIcons";
import { speakText } from "@/lib/speech/tts";
import RichText from "@/features/code-blocks/RichText";
import SecretFileItem from "./SecretFileItem";
import type { SharedFile } from "@/lib/types";

interface Props {
  payloadText: string;
  files?: SharedFile[];
  pin: string;
  isDetonating: boolean;
  countdown: number;
  onOpenCompiler: (code: string, language: string) => void;
}

export default function SecretPayload({
  payloadText,
  files,
  pin,
  isDetonating,
  countdown,
  onOpenCompiler,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-ok">Payload Decrypted</h2>
          {!!payloadText && (
            <button
              onClick={() => speakText(payloadText)}
              className="inline-flex items-center gap-1.5 bg-surface2 hover:bg-edge text-xs px-3 py-1.5 rounded-md text-ink border border-edge transition-colors font-semibold"
            >
              <SpeakerIcon />
              Read
            </button>
          )}
        </div>
        {isDetonating && <span className="text-accent font-black text-xl">00:0{countdown}</span>}
      </div>

      {!!payloadText && (
        <div className="w-full bg-code border border-edge rounded-lg p-4 sm:p-6 relative overflow-hidden text-sm">
          <div className="relative z-10 max-w-none text-code-ink">
            <RichText content={payloadText} onOpenCompiler={onOpenCompiler} isReceiver />
          </div>
          {isDetonating && (
            <div className="absolute inset-0 bg-accent/20 mix-blend-overlay pointer-events-none animate-pulse" />
          )}
        </div>
      )}

      {files && files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-mono font-bold text-muted tracking-wider">
            ATTACHED FILES ({files.length})
          </h3>
          {files.map((file, index) => (
            <SecretFileItem key={`${file.name}-${index}`} file={file} pin={pin} />
          ))}
        </div>
      )}
    </div>
  );
}