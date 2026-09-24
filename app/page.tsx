"use client";
import { useState, useEffect } from "react";
import LoginBar from "@/features/auth/LoginBar";
import PastebinWorkspace from "@/features/pastebin/PastebinWorkspace";
import GroupWorkspace from "@/features/group-message/GroupWorkspace";
import MatrixRain from "@/components/animations/MatrixRain";
import FlyingPlane from "@/components/animations/FlyingPlane";
import DictationStudio from "@/components/popups/DictationStudio";
import CompilerStudio from "@/components/popups/CompilerStudio";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [currentGroup, setCurrentGroup] = useState("");
  const [activeTab, setActiveTab] = useState<"pastebin" | "groups">("pastebin");

  // Shared Modal States
  const [isDictationOpen, setIsDictationOpen] = useState(false);
  const [dictateTarget, setDictateTarget] = useState<"pastebin" | "chat" | null>(null);
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerPayload, setCompilerPayload] = useState({ code: "", lang: "" });

  // Pastebin & Group Text States
  const [pastebinText, setPastebinText] = useState("");
  const [chatText, setChatText] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);
  const [isFlying, setIsFlying] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const savedUser = localStorage.getItem("okshare_username"); if (savedUser) setUsername(savedUser);
    const savedGroup = localStorage.getItem("okshare_group"); if (savedGroup) { setCurrentGroup(savedGroup); setActiveTab("groups"); }
  }, []);

  const handleDictationInsert = (text: string) => {
    if (dictateTarget === "pastebin") setPastebinText(prev => prev + (prev && !prev.endsWith(" ") && text ? " " : "") + text);
    else if (dictateTarget === "chat") setChatText(prev => prev + (prev && !prev.endsWith(" ") && text ? " " : "") + text);
  };

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col">
      <CompilerStudio isOpen={isCompilerOpen} onClose={() => setIsCompilerOpen(false)} initialCode={compilerPayload.code} initialLang={compilerPayload.lang} />
      <DictationStudio isOpen={isDictationOpen} onClose={() => setIsDictationOpen(false)} onInsert={handleDictationInsert} />
      <MatrixRain isVisible={requirePasscode} />
      <FlyingPlane isVisible={isFlying} />

      <header className="sticky top-0 z-30 border-b border-edge bg-surface/90 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white text-sm shrink-0">O</span>
            <span className="text-ink">OK-<span className="text-accent">Share</span></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ThemeToggle />
            <LoginBar username={username} setUsername={setUsername} onLogout={() => { setCurrentGroup(""); setActiveTab("pastebin"); }} />
          </div>
        </div>
      </header>

      <div className="flex-1 w-full mx-auto max-w-5xl px-4 py-6 sm:py-10 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {activeTab === "pastebin" ? (
              <>OK-<span className="text-accent">Share</span></>
            ) : (
              <>Group <span className="text-accent">Workspaces</span></>
            )}
          </h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            {activeTab === "pastebin"
              ? "Burn-after-reading text and code snippets."
              : currentGroup
                ? `Active Channel: #${currentGroup}`
                : "Create a group workspace and add only registered friends."}
          </p>
        </div>

        <div className="w-full bg-surface border border-edge rounded-xl shadow-sm">
          {username && (
            <div className="flex border-b border-edge">
              <button onClick={() => setActiveTab("pastebin")} className={`flex-1 sm:flex-none sm:px-8 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "pastebin" ? "border-accent text-accent bg-accent-soft" : "border-transparent text-muted hover:text-ink"}`}>
                Ephemeral Pastebin
              </button>
              <button onClick={() => setActiveTab("groups")} className={`flex-1 sm:flex-none sm:px-8 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "groups" ? "border-accent text-accent bg-accent-soft" : "border-transparent text-muted hover:text-ink"}`}>
                Group Workspaces
              </button>
            </div>
          )}

          <div className="p-4 sm:p-8">
            {activeTab === "pastebin" ? (
              <PastebinWorkspace onOpenDictation={() => { setDictateTarget("pastebin"); setIsDictationOpen(true); }} setIsFlying={setIsFlying} requirePasscode={requirePasscode} setRequirePasscode={setRequirePasscode} text={pastebinText} setText={setPastebinText} />
            ) : (
              <GroupWorkspace username={username} currentGroup={currentGroup} setCurrentGroup={setCurrentGroup} newMessageText={chatText} setNewMessageText={setChatText} onOpenDictation={() => { setDictateTarget("chat"); setIsDictationOpen(true); }} onOpenCompiler={(code, lang) => { setCompilerPayload({ code, lang }); setIsCompilerOpen(true); }} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}