"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props { isOpen: boolean; onClose: () => void; onInsert: (text: string) => void; }

export default function DictationStudio({ isOpen, onClose, onInsert }: Props) {
  const [dictatedText, setDictatedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    if (isOpen) { setDictatedText(""); setInterimText(""); setTimeout(() => startRecording(), 100); }
    else stopRecording();
  }, [isOpen]);

  function startRecording() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Speech recognition is not supported."); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = "en-US";
    manualStopRef.current = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event: any) => {
      let finalStr = ""; let interimStr = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalStr += event.results[i][0].transcript;
        else interimStr += event.results[i][0].transcript;
      }
      if (finalStr) setDictatedText(prev => prev + (prev && !prev.endsWith(" ") ? " " : "") + finalStr);
      setInterimText(interimStr);
    };
    recognition.onerror = (e: any) => {
      if (['not-allowed', 'service-not-allowed', 'network'].includes(e.error)) {
        manualStopRef.current = true; setIsRecording(false);
      }
    };
    recognition.onend = () => {
      if (!manualStopRef.current) { try { recognition.start(); } catch (e) { setIsRecording(false); } } 
      else setIsRecording(false);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { console.error(e); }
  }

  function stopRecording() {
    manualStopRef.current = true; if (recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); setInterimText("");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-sm">
          <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} transition={{ duration: 0.15 }} className="bg-surface border border-edge w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${isRecording ? "bg-accent animate-pulse" : "bg-muted"}`} />
                Dictation Studio
              </h3>
              <button onClick={onClose} className="text-muted hover:text-accent font-bold text-xl transition-colors" aria-label="Close">✕</button>
            </div>
            <p className="text-xs text-muted mb-3">Speak continuously. Pause anytime, the mic will stay on until you hit Stop.</p>
            <textarea value={dictatedText} onChange={(e) => setDictatedText(e.target.value)} className="w-full h-40 bg-code text-code-ink border border-edge rounded-lg p-3 font-mono focus:outline-none resize-none" placeholder="Waiting for speech..." />
            <div className="h-6 mt-2 text-sm text-ok italic truncate font-mono">{interimText && `Listening: ${interimText}...`}</div>
            <div className="flex justify-between mt-4 gap-3">
              <button onClick={isRecording ? stopRecording : startRecording} className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isRecording ? 'bg-accent hover:bg-accent-hover text-white' : 'bg-surface2 hover:bg-edge text-ink border border-edge'}`}>
                {isRecording ? "Stop" : "Resume"}
              </button>
              <button onClick={() => { onInsert(dictatedText); onClose(); }} className="bg-ok hover:opacity-90 text-white px-6 py-2 rounded-lg font-semibold transition-opacity text-sm">
                Insert Text
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}