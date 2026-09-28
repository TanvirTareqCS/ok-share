"use client";

import { useState } from "react";

interface Props {
  isJoining: boolean;
  onJoin: (groupName: string, passphrase: string) => Promise<boolean>;
}

export default function JoinGroupForm({ isJoining, onJoin }: Props) {
  const [groupName, setGroupName] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupName.trim()) return;

    const isJoined = await onJoin(groupName, passphrase);
    if (!isJoined) return;

    setGroupName("");
    setPassphrase("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface2/60 border border-edge rounded-lg p-5 space-y-4">
      <h2 className="text-base font-bold text-ink">Enter Existing Group</h2>
      <div>
        <label className="text-xs text-muted block mb-1.5 font-semibold">Group Name</label>
        <input
          type="text"
          placeholder="e.g. project-alpha"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
          className="w-full rounded-md p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted block mb-1.5 font-semibold">
          Passphrase (if channel is encrypted)
        </label>
        <input
          type="password"
          placeholder="e.g. blue-mango-42"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          className="w-full rounded-md p-2.5 text-sm"
        />
      </div>
      <p className="text-xs text-muted pt-6">
        If the group does not exist or you are not a member, entry will be blocked.
      </p>
      <button
        type="submit"
        disabled={isJoining}
        className="w-full bg-surface2 hover:bg-edge text-ink border border-edge py-2.5 rounded-md font-semibold transition-colors text-sm"
      >
        {isJoining ? "Checking..." : "Enter Channel"}
      </button>
    </form>
  );
}
