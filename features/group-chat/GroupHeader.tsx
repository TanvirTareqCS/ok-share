"use client";

interface Props {
  groupName: string;
  members: string[];
  isSealed: boolean;
  typingUsers: string[];
  unreadCount: number;
  onLeave: () => void;
}

export default function GroupHeader({
  groupName,
  members,
  isSealed,
  typingUsers,
  unreadCount,
  onLeave,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center bg-surface2/60 p-3 rounded-lg border border-edge text-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
        <span className="text-ok font-bold">#{groupName}</span>
        {isSealed && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
            🔒 E2E
          </span>
        )}
        <span className="text-muted text-xs truncate">Members: {members.join(", ") || "none"}</span>
        {typingUsers.length > 0 && (
          <span className="text-ok text-xs animate-pulse">✍ {typingUsers.join(", ")} typing…</span>
        )}
        {unreadCount > 0 && <span className="text-accent text-xs font-bold">● {unreadCount} new</span>}
      </div>
      <button
        onClick={onLeave}
        className="text-accent text-xs font-semibold underline self-start sm:self-auto"
      >
        Leave Channel
      </button>
    </div>
  );
}
