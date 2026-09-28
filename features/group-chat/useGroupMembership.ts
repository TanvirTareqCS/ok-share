"use client";

import { useCallback, useState } from "react";
import { get, ref, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { createChannelCheck, deriveChannelKey, generateSalt } from "@/lib/crypto/secretCipher";

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
  isManaging: boolean;
  createGroup: (input: CreateGroupInput) => Promise<boolean>;
  joinGroup: (groupName: string, passphrase: string) => Promise<boolean>;
  addMembers: (groupName: string, memberInput: string) => Promise<boolean>;
  removeMember: (groupName: string, memberName: string) => Promise<boolean>;
  promoteMember: (groupName: string, memberName: string) => Promise<boolean>;
  demoteMember: (groupName: string, memberName: string) => Promise<boolean>;
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
  const [isManaging, setIsManaging] = useState(false);

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

      let check;
      if (trimmedPassphrase) {
        const key = await deriveChannelKey(trimmedPassphrase, salt);
        check = await createChannelCheck(key);
      }

      await set(ref(db, DB_PATHS.groupMeta(name)), {
        creator: username,
        members: members.filter((member) => member !== username),
        createdAt: Date.now(),
        ...(trimmedPassphrase ? { sealed: true, salt, check } : {}),
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

  const addMembers = useCallback(
    async (groupName: string, memberInput: string) => {
      if (!groupName.trim()) return false;

      setIsManaging(true);
      try {
        const name = groupName.trim();
        const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(name)));
        if (!metaSnapshot.exists()) {
          alert("Group does not exist.");
          return false;
        }

        const meta = metaSnapshot.val();
        if (meta.creator !== username && !meta.admins?.includes(username)) {
          alert("Only the creator or an admin can manage members.");
          return false;
        }

        const existing = new Set<string>(meta.members || []);
        existing.add(meta.creator);

        const requested = parseMemberHandles(memberInput);
        if (requested.length === 0) return false;

        const additions: string[] = [];
        for (const member of requested) {
          if (existing.has(member)) continue;
          const userSnapshot = await get(ref(db, DB_PATHS.user(member)));
          if (!userSnapshot.exists()) {
            alert(`User @${member} not registered!`);
            return false;
          }
          additions.push(member);
        }

        if (additions.length === 0) {
          alert("Those users are already members.");
          return false;
        }

        await set(ref(db, DB_PATHS.groupMembers(name)), [...(meta.members || []), ...additions]);
        return true;
      } finally {
        setIsManaging(false);
      }
    },
    [username],
  );

  const removeMember = useCallback(
    async (groupName: string, memberName: string) => {
      if (!groupName.trim() || !memberName) return false;

      setIsManaging(true);
      try {
        const name = groupName.trim();
        const member = memberName.trim().replace(/^@/, "");
        const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(name)));
        if (!metaSnapshot.exists()) {
          alert("Group does not exist.");
          return false;
        }

        const meta = metaSnapshot.val();
        if (meta.creator !== username && !meta.admins?.includes(username)) {
          alert("Only the creator or an admin can manage members.");
          return false;
        }
        if (meta.creator === member) {
          alert("The creator cannot be removed.");
          return false;
        }
        if (member === username) {
          alert("Use Leave Channel to exit the group.");
          return false;
        }
        if (meta.creator !== username && meta.admins?.includes(member)) {
          alert("Admins can't remove other admins.");
          return false;
        }

        const remaining = (meta.members || []).filter((item: string) => item !== member);
        await set(ref(db, DB_PATHS.groupMembers(name)), remaining);
        return true;
      } finally {
        setIsManaging(false);
      }
    },
    [username],
  );

  const promoteMember = useCallback(
    async (groupName: string, memberName: string) => {
      if (!groupName.trim() || !memberName) return false;

      setIsManaging(true);
      try {
        const name = groupName.trim();
        const member = memberName.trim().replace(/^@/, "");
        const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(name)));
        if (!metaSnapshot.exists()) {
          alert("Group does not exist.");
          return false;
        }

        const meta = metaSnapshot.val();
        if (meta.creator !== username) {
          alert("Only the creator can promote admins.");
          return false;
        }
        if (meta.creator === member) {
          alert("The creator is already an admin.");
          return false;
        }
        if (!meta.members?.includes(member)) {
          alert(`@${member} is not a member of this group.`);
          return false;
        }

        const admins = meta.admins || [];
        if (!admins.includes(member)) {
          await set(ref(db, DB_PATHS.groupAdmins(name)), [...admins, member]);
        }
        return true;
      } finally {
        setIsManaging(false);
      }
    },
    [username],
  );

  const demoteMember = useCallback(
    async (groupName: string, memberName: string) => {
      if (!groupName.trim() || !memberName) return false;

      setIsManaging(true);
      try {
        const name = groupName.trim();
        const member = memberName.trim().replace(/^@/, "");
        const metaSnapshot = await get(ref(db, DB_PATHS.groupMeta(name)));
        if (!metaSnapshot.exists()) {
          alert("Group does not exist.");
          return false;
        }

        const meta = metaSnapshot.val();
        if (meta.creator !== username) {
          alert("Only the creator can demote admins.");
          return false;
        }

        const admins = meta.admins || [];
        if (admins.includes(member)) {
          await set(
            ref(db, DB_PATHS.groupAdmins(name)),
            admins.filter((admin: string) => admin !== member),
          );
        }
        return true;
      } finally {
        setIsManaging(false);
      }
    },
    [username],
  );

  return {
    isCreating,
    isJoining,
    isManaging,
    createGroup,
    joinGroup,
    addMembers,
    removeMember,
    promoteMember,
    demoteMember,
  };
}
