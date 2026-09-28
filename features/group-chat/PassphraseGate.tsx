"use client";

import { useState } from "react";

interface Props {
  onUnlock: (passphrase: string) => Promise<boolean>;
}

export default function PassphraseGate({ onUnlock }: Props) {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const isUnlocked = await onUnlock(passphrase);
    if (isUnlocked) {
      setPassphrase("");
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-accent-soft border rounded-lg p-3 ${error ? "border-red-500/60" : "border-accent/40"}`}
    >
      <span className="text-xs font-mono font-bold text-accent tracking-wider whitespace-nowrap">
        ENCRYPTED CHANNEL
      </span>
      <input
        type="password"
        value={passphrase}
        onChange={(event) => {
          setPassphrase(event.target.value);
          setError(false);
        }}
        placeholder="Enter channel passphrase..."
        className="flex-1 rounded-md p-2 text-center text-sm font-mono"
      />
      <button
        type="submit"
        className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-semibold"
      >
        Unlock
      </button>
      {error && (
        <span className="text-xs text-red-500 font-semibold sm:absolute sm:right-3 sm:-bottom-5">
          Wrong passphrase, try again.
        </span>
      )}
    </form>
  );
}
