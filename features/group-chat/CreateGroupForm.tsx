"use client";

import { useState } from "react";
import type { CreateGroupInput } from "./useGroupMembership";

interface Props {
  isCreating: boolean;
  onCreate: (input: CreateGroupInput) => Promise<boolean>;
}

export default function CreateGroupForm({ isCreating, onCreate }: Props) {
  const [groupName, setGroupName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!groupName.trim()) return;

    const isCreated = await onCreate({ groupName, memberInput, passphrase });
    if (!isCreated) return;

    setGroupName("");
    setMemberInput("");
    setPassphrase("");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface2/60 border border-edge rounded-lg p-5 space-y-4">
      <h2 className="text-base font-bold text-ink">Create New Group</h2>
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
        <label className="text-xs text-muted block mb-1.5 font-semibold">Add Registered Friends</label>
        <input
          type="text"
          placeholder="e.g. alice, bob"
          value={memberInput}
          onChange={(event) => setMemberInput(event.target.value)}
          className="w-full rounded-md p-2.5 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-muted block mb-1.5 font-semibold">Channel Passphrase (optional)</label>
        <input
          type="password"
          placeholder="e.g. blue-mango-42"
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          className="w-full rounded-md p-2.5 text-sm"
        />
        <p className="text-[11px] text-muted mt-1.5">
          Messages get encrypted end-to-end. Share the passphrase with members outside this app.
        </p>
      </div>
      <button
        type="submit"
        disabled={isCreating}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-md font-semibold transition-colors text-sm"
      >
        {isCreating ? "Creating..." : "Create & Enter Group"}
      </button>
    </form>
  );
}
