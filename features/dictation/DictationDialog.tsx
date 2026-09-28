"use client";

import { AnimatePresence, motion } from "framer-motion";
import DictationPanel from "./DictationPanel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}

export default function DictationDialog({ isOpen, onClose, onInsert }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-backdrop backdrop-blur-sm"
        >
          <DictationPanel onClose={onClose} onInsert={onInsert} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
