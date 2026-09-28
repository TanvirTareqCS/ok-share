"use client";

import Link from "next/link";
import MatrixRain from "@/components/animations/MatrixRain";
import FlyingPlane from "@/components/animations/FlyingPlane";
import LoginBar from "@/features/auth/LoginBar";
import CompilerDialog from "@/features/compiler/CompilerDialog";
import DictationDialog from "@/features/dictation/DictationDialog";
import GroupWorkspace from "@/features/group-chat/GroupWorkspace";
import PastebinWorkspace from "@/features/pastebin/PastebinWorkspace";
import ThemeToggle from "@/features/theme/ThemeToggle";
import { appendWithSeparator, useDictationDialog } from "./useDictationDialog";
import { useCompilerDialog } from "./useCompilerDialog";
import { useWorkspaceSession } from "./useWorkspaceSession";

const TAB_LABELS = {
  pastebin: "Ephemeral Pastebin",
  groups: "Group Workspaces",
} as const;

export default function HomeShell() {
  const session = useWorkspaceSession();
  const compiler = useCompilerDialog();

  const dictation = useDictationDialog((target, text) => {
    if (target === "pastebin") {
      session.setPastebinText((previous) => appendWithSeparator(previous, text));
    } else {
      session.setChatText((previous) => appendWithSeparator(previous, text));
    }
  });

  if (!session.isMounted) return null;

  const isPastebinTab = session.activeTab === "pastebin";

  return (
    <main className="min-h-screen bg-bg text-ink flex flex-col">
      <CompilerDialog
        isOpen={compiler.isOpen}
        onClose={compiler.closeCompiler}
        initialCode={compiler.payload.code}
        initialLanguage={compiler.payload.language}
      />
      <DictationDialog
        isOpen={dictation.isOpen}
        onClose={dictation.closeDictation}
        onInsert={dictation.insertText}
      />
      <MatrixRain isVisible={session.requirePasscode} />
      <FlyingPlane isVisible={session.isFlying} />

      <header className="sticky top-0 z-30 border-b border-edge bg-surface/90 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white text-sm shrink-0">
              O
            </span>
            <span className="text-ink">
              OK-<span className="text-accent">Share</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ThemeToggle />
            <LoginBar username={session.username} onLogin={session.login} onLogout={session.logout} />
          </div>
        </div>
      </header>

      <div className="flex-1 w-full mx-auto max-w-5xl px-4 py-6 sm:py-10 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink">
            {isPastebinTab ? (
              <>
                OK-<span className="text-accent">Share</span>
              </>
            ) : (
              <>
                Group <span className="text-accent">Workspaces</span>
              </>
            )}
          </h1>
          <p className="text-muted mt-2 text-sm sm:text-base">
            {isPastebinTab
              ? "Burn-after-reading text and code snippets."
              : session.currentGroup
                ? `Active Channel: #${session.currentGroup}`
                : "Create a group workspace and add only registered friends."}
          </p>
        </div>

        <div className="w-full bg-surface border border-edge rounded-xl shadow-sm">
          {session.username && (
            <div className="flex border-b border-edge">
              {(["pastebin", "groups"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => session.setActiveTab(tab)}
                  className={`flex-1 sm:flex-none sm:px-8 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                    session.activeTab === tab
                      ? "border-accent text-accent bg-accent-soft"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 sm:p-8">
            {isPastebinTab ? (
              <PastebinWorkspace
                text={session.pastebinText}
                setText={session.setPastebinText}
                requirePasscode={session.requirePasscode}
                setRequirePasscode={session.setRequirePasscode}
                setIsFlying={session.setIsFlying}
                onOpenDictation={() => dictation.openFor("pastebin")}
              />
            ) : (
              <GroupWorkspace
                username={session.username}
                currentGroup={session.currentGroup}
                setCurrentGroup={session.setCurrentGroup}
                newMessageText={session.chatText}
                setNewMessageText={session.setChatText}
                onOpenDictation={() => dictation.openFor("chat")}
                onOpenCompiler={compiler.openCompiler}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
