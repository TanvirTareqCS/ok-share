"use client";

import { motion } from "framer-motion";
import { useSpeechRecognition } from "./useSpeechRecognition";

interface Props {
  onClose: () => void;
  onInsert: (text: string) => void;
}

export default function DictationPanel({ onClose, onInsert }: Props) {
  const session = useSpeechRecognition();

  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-edge w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col relative"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-ink flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${session.isRecording ? "bg-accent animate-pulse" : "bg-muted"}`}
          />
          Dictation Studio
        </h3>
        <button
          onClick={onClose}
          className="text-muted hover:text-accent font-bold text-xl transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-muted mb-3">
        Speak continuously. Pause anytime, the mic will stay on until you hit Stop.
      </p>

      <textarea
        value={session.dictatedText}
        onChange={(event) => session.setDictatedText(event.target.value)}
        className="w-full h-40 bg-code text-code-ink border border-edge rounded-lg p-3 font-mono focus:outline-none resize-none"
        placeholder="Waiting for speech..."
      />

      <div className="h-6 mt-2 text-sm text-ok italic truncate font-mono">
        {session.interimText && `Listening: ${session.interimText}...`}
      </div>

      <div className="flex justify-between mt-4 gap-3">
        <button
          onClick={session.isRecording ? session.stop : session.start}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            session.isRecording
              ? "bg-accent hover:bg-accent-hover text-white"
              : "bg-surface2 hover:bg-edge text-ink border border-edge"
          }`}
        >
          {session.isRecording ? "Stop" : "Resume"}
        </button>
        <button
          onClick={() => {
            onInsert(session.dictatedText);
            onClose();
          }}
          className="bg-ok hover:opacity-90 text-white px-6 py-2 rounded-lg font-semibold transition-opacity text-sm"
        >
          Insert Text
        </button>
      </div>
    </motion.div>
  );
}
