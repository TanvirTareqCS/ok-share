"use client";

import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { confirmLogout, registerUsername, removeUserAndGroups, stripHandlePrefix } from "./authService";

interface Props {
  username: string;
  onLogin: (username: string) => void;
  onLogout: () => void;
}

export default function LoginBar({ username, onLogin, onLogout }: Props) {
  const [draftUsername, setDraftUsername] = useState("");

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draftUsername.trim()) return;

    const cleanUsername = stripHandlePrefix(draftUsername);
    await registerUsername(cleanUsername);

    localStorage.setItem(STORAGE_KEYS.username, cleanUsername);
    onLogin(cleanUsername);
    setDraftUsername("");
  };

  const handleLogout = async () => {
    if (!confirmLogout()) return;

    if (username) {
      await removeUserAndGroups(username);
    }

    localStorage.removeItem(STORAGE_KEYS.username);
    localStorage.removeItem(STORAGE_KEYS.activeGroup);
    onLogout();
  };

  if (username) {
    return (
      <div className="flex items-center gap-2 bg-surface border border-edge rounded-lg px-3 py-1.5">
        <span className="hidden sm:inline text-xs text-muted">Logged in as:</span>
        <span className="text-sm font-bold text-accent">@{username}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-muted hover:text-accent underline ml-1 font-semibold whitespace-nowrap"
        >
          Logout &amp; Wipe
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="flex items-center gap-2 bg-surface border border-edge rounded-lg px-2 py-1.5">
      <input
        type="text"
        placeholder="Username"
        aria-label="Username"
        value={draftUsername}
        onChange={(event) => setDraftUsername(event.target.value)}
        className="bg-transparent border-none focus:border-none focus:shadow-none w-24 sm:w-32 text-sm text-ink"
      />
      <button
        type="submit"
        className="bg-accent hover:bg-accent-hover text-white px-3 py-1 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
      >
        Login
      </button>
    </form>
  );
}
