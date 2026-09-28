"use client";

interface Props {
  encryptedDisplay: string;
  passcode: string;
  isDecrypting: boolean;
  onPasscodeChange: (passcode: string) => void;
  onSubmit: () => void;
}

export default function SecretPasscodeGate({
  encryptedDisplay,
  passcode,
  isDecrypting,
  onPasscodeChange,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6 text-center relative z-20"
    >
      <h1 className="text-xl sm:text-2xl font-bold text-accent">Protected Secret</h1>
      <p className="text-muted text-sm">Enter the decryption passcode to view the payload.</p>
      <div className="bg-code border border-edge2 p-4 rounded-lg overflow-hidden">
        <span className="text-ok font-mono text-sm tracking-widest break-all">{encryptedDisplay}</span>
      </div>
      <input
        type="password"
        value={passcode}
        onChange={(event) => onPasscodeChange(event.target.value)}
        placeholder="Enter Passcode..."
        className="w-full rounded-md p-3 text-center text-sm font-mono"
      />
      <button
        type="submit"
        disabled={isDecrypting}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3 rounded-md transition-colors"
      >
        {isDecrypting ? "DECRYPTING..." : "DECRYPT"}
      </button>
    </form>
  );
}
