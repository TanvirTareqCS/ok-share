"use client";
import { useState } from "react";
import { ref, set, remove, get } from "firebase/database";
import { db } from "@/lib/firebase/config";

export default function LoginBar({ username, setUsername, onLogout }: { username: string, setUsername: (u: string) => void, onLogout: () => void }) {
  const [tempUsername, setTempUsername] = useState(username);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUsername.trim()) return;
    const cleanUser = tempUsername.trim().replace(/^@/, '');
    await set(ref(db, `users/${cleanUser}`), { registered: true, lastLogin: Date.now() });
    localStorage.setItem("okshare_username", cleanUser);
    setUsername(cleanUser);
    setTempUsername("");
  };

  const handleClearUsername = async () => {
    if (!confirm("Logging out will wipe your temporary chat session data and exit your group. Continue?")) return;
    if (username) {
      await remove(ref(db, `users/${username}`));
      const groupsSnap = await get(ref(db, 'groups'));
      if (groupsSnap.exists()) {
        groupsSnap.forEach((groupSnap) => {
          const groupName = groupSnap.key; const meta = groupSnap.child('meta').val();
          if (meta) {
            groupSnap.child('messages').forEach((msgSnap) => { if (msgSnap.val().sender === username) remove(ref(db, `groups/${groupName}/messages/${msgSnap.key}`)); });
            if (meta.creator === username) {
              if (meta.members && meta.members.length > 0) {
                const newCreator = meta.members[0]; const newMembers = meta.members.slice(1);
                set(ref(db, `groups/${groupName}/meta`), { ...meta, creator: newCreator, members: newMembers });
              } else remove(ref(db, `groups/${groupName}`));
            } else if (meta.members?.includes(username)) {
              set(ref(db, `groups/${groupName}/meta/members`), meta.members.filter((m: string) => m !== username));
            }
          }
        });
      }
    }
    localStorage.removeItem("okshare_username"); localStorage.removeItem("okshare_group");
    setUsername(""); setTempUsername(""); onLogout();
  };

  if (username) {
    return (
      <div className="flex items-center gap-2 bg-surface border border-edge rounded-lg px-3 py-1.5">
        <span className="hidden sm:inline text-xs text-muted">Logged in as:</span>
        <span className="text-sm font-bold text-accent">@{username}</span>
        <button onClick={handleClearUsername} className="text-xs text-muted hover:text-accent underline ml-1 font-semibold whitespace-nowrap">
          Logout &amp; Wipe
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveUsername} className="flex items-center gap-2 bg-surface border border-edge rounded-lg px-2 py-1.5">
      <input
        type="text"
        placeholder="Username"
        aria-label="Username"
        value={tempUsername}
        onChange={(e) => setTempUsername(e.target.value)}
        className="bg-transparent border-none focus:border-none focus:shadow-none w-24 sm:w-32 text-sm text-ink"
      />
      <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded-md text-sm font-semibold transition-colors whitespace-nowrap">
        Login
      </button>
    </form>
  );
}