"use client";

interface Props {
  requirePasscode: boolean;
  maxViews: string;
  isLoading: boolean;
  onRequirePasscodeChange: (value: boolean) => void;
  onMaxViewsChange: (value: string) => void;
  onGenerate: () => void;
}

export default function PastebinOptions({
  requirePasscode,
  maxViews,
  isLoading,
  onRequirePasscodeChange,
  onMaxViewsChange,
  onGenerate,
}: Props) {
  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={requirePasscode}
            onChange={(event) => onRequirePasscodeChange(event.target.checked)}
            className="h-4 w-4 rounded border-edge text-accent"
          />
          <span className="text-sm text-muted">Require passcode</span>
        </label>
        <label className="flex items-center gap-2 select-none text-sm text-muted">
          <span>Auto-burn after</span>
          <input
            type="number"
            min={1}
            value={maxViews}
            onChange={(event) => onMaxViewsChange(event.target.value)}
            placeholder="∞"
            className="w-16 rounded-md p-2 text-center text-sm font-mono bg-surface2 border border-edge focus:outline-none focus:border-accent"
          />
          <span>view(s)</span>
        </label>
      </div>
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-colors w-full sm:w-auto sm:self-end"
      >
        {isLoading ? "Generating..." : "Generate Link"}
      </button>
    </div>
  );
}
