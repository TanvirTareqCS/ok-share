"use client";

interface Props {
  isLoading: boolean;
  isAutoBurned: boolean;
  isDetonating: boolean;
  onBurn: () => void;
}

export default function BurnControls({ isLoading, isAutoBurned, isDetonating, onBurn }: Props) {
  if (isLoading) return null;

  if (isAutoBurned) {
    return (
      <div className="w-full bg-surface2 border border-accent/40 text-accent font-bold py-4 rounded-md mt-4 text-center text-sm">
        AUTO-BURNED · THIS LINK IS DESTROYED
      </div>
    );
  }

  return (
    <button
      onClick={onBurn}
      disabled={isDetonating}
      className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/40 text-white font-bold py-4 rounded-md mt-4 transition-all"
    >
      {isDetonating ? "INCINERATING..." : "BURN AFTER READING"}
    </button>
  );
}
