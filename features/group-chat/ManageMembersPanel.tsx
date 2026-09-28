"use client";

import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";

interface Props {
  groupName: string;
  members: string[];
  admins: string[];
  isCreator: boolean;
  isAdmin: boolean;
  isSealed: boolean;
  isManaging: boolean;
  onAddMembers: (memberInput: string) => Promise<boolean>;
  onRemoveMember: (memberName: string) => Promise<boolean>;
  onPromoteMember: (memberName: string) => Promise<boolean>;
  onDemoteMember: (memberName: string) => Promise<boolean>;
}

export default function ManageMembersPanel({
  groupName,
  members,
  admins,
  isCreator,
  isAdmin,
  isSealed,
  isManaging,
  onAddMembers,
  onRemoveMember,
  onPromoteMember,
  onDemoteMember,
}: Props) {
  const [memberInput, setMemberInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [passphrase, setPassphrase] = useState("");

  const [creator] = members;
  const canManage = isCreator || isAdmin;

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberInput.trim()) return;

    setIsAdding(true);
    const added = await onAddMembers(memberInput);
    setIsAdding(false);
    if (added) setMemberInput("");
  };

  const handleRemove = async (memberName: string) => {
    if (!confirm(`Remove @${memberName} from this group?`)) return;
    await onRemoveMember(memberName);
  };

  const handlePromote = async (memberName: string) => {
    if (!confirm(`Promote @${memberName} to admin?`)) return;
    await onPromoteMember(memberName);
  };

  const handleDemote = async (memberName: string) => {
    if (!confirm(`Demote @${memberName} from admin?`)) return;
    await onDemoteMember(memberName);
  };

  const togglePassphrase = () => {
    if (!showPassphrase) {
      setPassphrase(localStorage.getItem(STORAGE_KEYS.groupPassphrase(groupName)) ?? "");
    }
    setShowPassphrase((visible) => !visible);
  };

  return (
    <div className="bg-surface2/60 border border-edge rounded-lg p-3 text-sm space-y-3">
      <h3 className="text-xs font-bold text-muted uppercase tracking-wide">Manage members</h3>

      <ul className="space-y-1.5">
        {members.map((member) => (
          <li key={member} className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-ink font-mono text-xs truncate flex items-center gap-1.5">
              @{member}
              {member === creator && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                  creator
                </span>
              )}
              {member !== creator && admins.includes(member) && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-ok/15 text-ok border border-ok/30">
                  admin
                </span>
              )}
            </span>
            <span className="flex items-center gap-2.5">
              {isCreator && member !== creator && !admins.includes(member) && (
                <button
                  type="button"
                  onClick={() => handlePromote(member)}
                  disabled={isManaging}
                  className="text-ok text-xs underline disabled:opacity-50"
                >
                  Promote
                </button>
              )}
              {isCreator && member !== creator && admins.includes(member) && (
                <button
                  type="button"
                  onClick={() => handleDemote(member)}
                  disabled={isManaging}
                  className="text-muted text-xs underline disabled:opacity-50"
                >
                  Demote
                </button>
              )}
              {canManage && member !== creator && (
                <button
                  type="button"
                  onClick={() => handleRemove(member)}
                  disabled={isManaging}
                  className="text-accent text-xs underline disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </span>
          </li>
        ))}
        {members.length === 0 && <li className="text-muted text-xs">No members yet.</li>}
      </ul>

      {canManage && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="Add members (@alice, @bob)"
            value={memberInput}
            onChange={(event) => setMemberInput(event.target.value)}
            className="flex-1 min-w-0 rounded-md p-2 text-sm"
          />
          <button
            type="submit"
            disabled={isAdding || isManaging}
            className="bg-surface2 hover:bg-edge text-ink border border-edge px-3 py-2 rounded-md font-semibold transition-colors text-sm disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add"}
          </button>
        </form>
      )}

      {isSealed && (
        <div className="text-xs text-muted space-y-2">
          <p>
            🔒 Encrypted channel — new members must enter the passphrase to read messages. Share the
            group name and passphrase with them.
          </p>
          <button type="button" onClick={togglePassphrase} className="text-accent underline">
            {showPassphrase ? "Hide" : "Reveal"} passphrase
          </button>
          {showPassphrase &&
            (passphrase ? (
              <p className="font-mono text-ink bg-surface p-2 rounded border border-edge break-all">
                {passphrase}
              </p>
            ) : (
              <p className="text-muted">No passphrase stored in this browser.</p>
            ))}
        </div>
      )}
    </div>
  );
}