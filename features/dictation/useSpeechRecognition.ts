"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FATAL_ERRORS,
  getSpeechRecognitionConstructor,
  type SpeechRecognitionLike,
} from "./speechRecognitionTypes";

const RECOGNITION_LANG = "en-US";
const AUTO_START_DELAY_MS = 100;

export interface SpeechSession {
  dictatedText: string;
  setDictatedText: (text: string) => void;
  interimText: string;
  isRecording: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * Owns one dictation session. Mount this inside the dialog so that closing the
 * dialog unmounts the session, which resets the transcript and releases the mic.
 */
export function useSpeechRecognition(): SpeechSession {
  const [dictatedText, setDictatedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isManualStopRef = useRef(false);

  const start = useCallback(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LANG;

    isManualStopRef.current = false;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalTranscript += result[0].transcript;
        else interimTranscript += result[0].transcript;
      }

      if (finalTranscript) {
        setDictatedText((previous) => {
          const needsSpace = previous && !previous.endsWith(" ");
          return `${previous}${needsSpace ? " " : ""}${finalTranscript}`;
        });
      }

      setInterimText(interimTranscript);
    };

    recognition.onerror = (event) => {
      if (!FATAL_ERRORS.has(event.error)) return;
      isManualStopRef.current = true;
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isManualStopRef.current) {
        setIsRecording(false);
        return;
      }
      try {
        recognition.start();
      } catch {
        setIsRecording(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const stop = useCallback(() => {
    isManualStopRef.current = true;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText("");
  }, []);

  useEffect(() => {
    const autoStartTimer = setTimeout(() => start(), AUTO_START_DELAY_MS);
    return () => {
      clearTimeout(autoStartTimer);
      stop();
    };
  }, [start, stop]);

  return { dictatedText, setDictatedText, interimText, isRecording, start, stop };
}
