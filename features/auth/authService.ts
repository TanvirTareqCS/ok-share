"use client";

import { get, ref, remove, set } from "firebase/database";
import { db } from "@/lib/firebase/database";
import { DB_PATHS } from "@/lib/firebase/paths";

const LOGOUT_WARNING =
  "Logging out will wipe your temporary chat session data and exit your group. Continue?";

export function stripHandlePrefix(value: string): string {
  return value.trim().replace(/^@/, "");
}

export async function registerUsername(cleanUsername: string): Promise<void> {
  await set(ref(db, DB_PATHS.user(cleanUsername)), {
    registered: true,
    lastLogin: Date.now(),
  });
}

export async function removeUserAndGroups(username: string): Promise<void> {
  await remove(ref(db, DB_PATHS.user(username)));

  const groupsSnapshot = await get(ref(db, DB_PATHS.allGroups));
  if (!groupsSnapshot.exists()) return;

  groupsSnapshot.forEach((groupSnapshot) => {
    const groupName = groupSnapshot.key;
    const meta = groupSnapshot.child("meta").val();
    if (!meta || !groupName) return;

    groupSnapshot.child("messages").forEach((messageSnapshot) => {
      if (messageSnapshot.val().sender === username) {
        remove(ref(db, DB_PATHS.groupMessage(groupName, messageSnapshot.key as string)));
      }
    });

    if (meta.creator === username) {
      if (meta.members && meta.members.length > 0) {
        set(ref(db, DB_PATHS.groupMeta(groupName)), {
          ...meta,
          creator: meta.members[0],
          members: meta.members.slice(1),
        });
      } else {
        remove(ref(db, DB_PATHS.group(groupName)));
      }
    } else if (meta.members?.includes(username)) {
      set(
        ref(db, DB_PATHS.groupMembers(groupName)),
        meta.members.filter((member: string) => member !== username),
      );
    }
  });
}

export function confirmLogout(): boolean {
  return confirm(LOGOUT_WARNING);
}
