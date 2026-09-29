"use client";

import { useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";
import { useIsHydrated } from "@/lib/useIsHydrated";

export type WorkspaceTab = "pastebin" | "groups";

function readStoredUsername(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.username) ?? "";
}

function readStoredGroup(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.activeGroup) ?? "";
}

export interface WorkspaceSession {
  isMounted: boolean;
  username: string;
  currentGroup: string;
  activeTab: WorkspaceTab;
  pastebinText: string;
  chatText: string;
  requirePasscode: boolean;
  isFlying: boolean;
  setCurrentGroup: (groupName: string) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setPastebinText: React.Dispatch<React.SetStateAction<string>>;
  setChatText: React.Dispatch<React.SetStateAction<string>>;
  setRequirePasscode: (value: boolean) => void;
  setIsFlying: (value: boolean) => void;
  login: (username: string) => void;
  logout: () => void;
}

export function useWorkspaceSession(): WorkspaceSession {
  const isMounted = useIsHydrated();

  const [username, setUsername] = useState(readStoredUsername);
  const [currentGroup, setCurrentGroup] = useState(readStoredGroup);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() =>
    readStoredGroup() ? "groups" : "pastebin",
  );
  const [pastebinText, setPastebinText] = useState("");
  const [chatText, setChatText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  const login = (nextUsername: string) => {
    setUsername(nextUsername);
  };

  const logout = () => {
    setUsername("");
    setCurrentGroup("");
    setActiveTab("pastebin");
    setPastebinText("");
    setChatText("");
    setRequirePasscode(false);
  };

  return {
    isMounted,
    username,
    currentGroup,
    activeTab,
    pastebinText,
    chatText,
    requirePasscode,
    isFlying,
    setCurrentGroup,
    setActiveTab,
    setPastebinText,
    setChatText,
    setRequirePasscode,
    setIsFlying,
    login,
    logout,
  };
}
