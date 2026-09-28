"use client";

import { useCallback, useState } from "react";
import { get, ref, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { generateSalt } from "@/lib/crypto/secretCipher";

interface Args {
  username: string;
  onGroupEntered: (groupName: string) => void;
}

export interface CreateGroupInput {
  groupName: string;
  memberInput: string;
  passphrase: string;
}

export interface GroupMembership {
  isCreating: boolean;
  isJoining: boolean;
  createGroup: (input: CreateGroupInput) => Promise<boolean>;
  joinGroup: (groupName: string, passphrase: string) => Promise<boolean>;
}

function parseMemberHandles(memberInput: string): string[] {
  if (!memberInput) return [];
  return memberInput
    .split(",")
    .map((member) => member.trim().replace(/^@/, ""))
    .filter(Boolean);
}

export function useGroupMembership({ username, onGroupEntered }: Args): GroupMembership {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const enterGroup = useCallback(
    (groupName: string) => {
      onGroupEntered(groupName);
      localStorage.setItem(STORAGE_KEYS.activeGroup, groupName);
    },
    [onGroupEntered],
  );

  const createGroup = useCallback(
    async ({ groupName, memberInput, passphrase }: CreateGroupInput) => {
      if (!groupName.trim()) return false;

      setIsCreating(true);
      const name = groupName.trim();

      const groupSnapshot = await get(ref(db, DB_PATHS.group(name)));
      if (groupSnapshot.exists()) {
        alert("Group name taken!");
        setIsCreating(false);
        return false;
      }

      const members = parseMemberHandles(memberInput);
      for (const member of members) {
        const userSnapshot = await get(ref(db, DB_PATHS.user(member)));
        if (!userSnapshot.exists()) {
          alert(`User @${member} not registered!`);
          setIsCreating(false);
          return false;
        }
      }

      const trimmedPassphrase = passphrase.trim();
      const salt = trimmedPassphrase ? generateSalt() : "";

      await set(ref(db, DB_PATHS.groupMeta(name)), {
        creator: username,
        members: members.filter((member) => member !== username),
        createdAt: Date.now(),
        ...(trimmedPassphrase ? { sealed: true, salt } : {}),
      });

      if (trimmedPassphrase) {
        localStorage.setItem(STORAGE_KEYS.groupPassphrase(name), trimmedPassphrase);
      }

      enterGroup(name);
      setIsCreating(false);
      return true;
    },
    [enterGroup, username],
  );

  const joinGroup = useCallback(
    async (groupName: string, passphrase: string) => {
      if (!groupName.trim()) return false;

      setIsJoining(true);
      const name = groupName.trim();
      const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(name)));

      if (metaSnapshot.exists()) {
        const meta = metaSnapshot.val();
        const isMember = meta.creator === username || meta.members?.includes(username);

        if (isMember) {
          if (passphrase.trim()) {
            localStorage.setItem(STORAGE_KEYS.groupPassphrase(name), passphrase.trim());
          }
          enterGroup(name);
          setIsJoining(false);
          return true;
        }

        alert("Not authorized.");
      } else {
        alert("Group does not exist.");
      }

      setIsJoining(false);
      return false;
    },
    [enterGroup, username],
  );

  return { isCreating, isJoining, createGroup, joinGroup };
}
