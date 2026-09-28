"use client";

import { motion } from "framer-motion";

interface Props {
  shareableLink: string;
  onCreateAnother: () => void;
}

export default function ShareLinkResult({ shareableLink, onCreateAnother }: Props) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-surface2/60 border border-ok/30 rounded-lg p-6 text-center space-y-4"
    >
      <h2 className="text-lg font-bold text-ok">Link Generated Successfully</h2>
      <p className="text-sm text-muted">
        Share this link with your friend. It will remain until it is destroyed.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-code border border-edge2 rounded-lg p-2">
        <input
          type="text"
          readOnly
          value={shareableLink}
          className="flex-1 bg-transparent border-none text-ok font-mono text-sm focus:outline-none text-center sm:text-left"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareableLink);
            alert("Link copied!");
          }}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
        >
          Copy
        </button>
      </div>
      <button
        onClick={onCreateAnother}
        className="text-sm text-muted hover:text-ink underline transition-colors pt-1 font-semibold"
      >
        Create another secret
      </button>
    </motion.div>
  );
}
