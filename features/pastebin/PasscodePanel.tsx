"use client";

import useScrambleText from "@/lib/useScrambleText";

interface Props {
  passcode: string;
  onPasscodeChange: (passcode: string) => void;
}

export default function PasscodePanel({ passcode, onPasscodeChange }: Props) {
  const scrambled = useScrambleText(true, 14, "SECURE_CIPHER_ACTIVE");

  return (
    <div className="bg-accent-soft border border-accent/40 rounded-lg p-4">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <span className="text-xs font-mono font-bold text-accent tracking-wider">
          PASSCODE PROTECTED
        </span>
        <span className="text-xs font-mono text-ok">{scrambled}</span>
      </div>
      <input
        type="password"
        value={passcode}
        onChange={(event) => onPasscodeChange(event.target.value)}
        placeholder="Enter decryption passcode..."
        className="w-full rounded-md p-3 text-center text-sm font-mono"
      />
    </div>
  );
}
