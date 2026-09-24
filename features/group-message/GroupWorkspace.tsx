"use client";
import { useState, useEffect, useRef } from "react";
import { ref, set, push, onValue, get, remove } from "firebase/database";
import { db } from "@/lib/firebase/config";
import { speakText } from "@/lib/speech/tts";
import RenderContent from "@/components/ui/RenderContent";
import { Message } from "@/types";
import { deriveChannelKey, sealWithKey, openWithKey, generateSalt } from "@/lib/crypto/secretCipher";

interface Props { username: string; currentGroup: string; setCurrentGroup: (g: string) => void; onOpenDictation: () => void; onOpenCompiler: (c: string, l: string) => void; newMessageText: string; setNewMessageText: React.Dispatch<React.SetStateAction<string>>; }

export default function GroupWorkspace({ username, currentGroup, setCurrentGroup, onOpenDictation, onOpenCompiler, newMessageText, setNewMessageText }: Props) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState("");
  const [newGroupPassphrase, setNewGroupPassphrase] = useState("");
  const [joinGroupName, setJoinGroupName] = useState("");
  const [joinGroupPassphrase, setJoinGroupPassphrase] = useState("");
  const [groupMembersList, setGroupMembersList] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);

  const [isGroupSealed, setIsGroupSealed] = useState(false);
  const [groupSalt, setGroupSalt] = useState("");
  const [channelKey, setChannelKey] = useState<CryptoKey | null>(null);
  const channelKeyRef = useRef<CryptoKey | null>(null);
  const [needsPassphrase, setNeedsPassphrase] = useState(false);
  const [pendingPassphrase, setPendingPassphrase] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [lastReadBy, setLastReadBy] = useState<Record<string, number>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const setChannelKeyBoth = (key: CryptoKey | null) => { channelKeyRef.current = key; setChannelKey(key); };

  const clearTyping = () => { if (currentGroup && username) remove(ref(db, `groups/${currentGroup}/meta/typing/${username}`)); };

  const resetTypingTimer = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => { clearTyping(); }, 1800);
  };

  const handleTyping = () => {
    if (!currentGroup || !username) return;
    set(ref(db, `groups/${currentGroup}/meta/typing/${username}`), Date.now());
    resetTypingTimer();
  };

  const handleLeaveLocal = () => {
    if (currentGroup && typingTimerRef.current) clearTimeout(typingTimerRef.current);
    clearTyping();
    setCurrentGroup(""); localStorage.removeItem("okshare_group"); setMessages([]); setGroupMembersList([]);
    setTypingUsers([]); setNeedsPassphrase(false); setPendingPassphrase(""); setChannelKeyBoth(null); setIsGroupSealed(false); setGroupSalt("");
  };

  useEffect(() => {
    if (!currentGroup || !username) return;
    const metaRef = ref(db, `groups/${currentGroup}/meta`);
    const unsubMeta = onValue(metaRef, (snapshot) => {
      if (!snapshot.exists()) {
        alert("Group was deleted.");
        handleLeaveLocal();
        return;
      }
      const data = snapshot.val();
      if (data.creator !== username && !data.members?.includes(username)) { alert("Removed from group."); handleLeaveLocal(); return; }
      setGroupMembersList([data.creator, ...(data.members || [])]);

      const typing = data.typing || {};
      const now = Date.now();
      setTypingUsers(Object.keys(typing).filter((u) => u !== username && now - (typing[u] ?? 0) < 3000));
      setLastReadBy(data.lastRead || {});
      setIsGroupSealed(!!data.sealed);
      if (typeof data.salt === "string") setGroupSalt(data.salt);

      if (data.sealed && !channelKeyRef.current) {
        const stored = localStorage.getItem(`okshare_sg_${currentGroup}`);
        if (stored) {
          deriveChannelKey(stored, data.salt).then((key) => { setChannelKeyBoth(key); setNeedsPassphrase(false); }).catch(() => setNeedsPassphrase(true));
        } else setNeedsPassphrase(true);
      }
    });
    return () => { unsubMeta(); };
  }, [currentGroup, username]);

  useEffect(() => {
    if (!currentGroup || !username) return;
    const msgRef = ref(db, `groups/${currentGroup}/messages`);
    const unsubMsg = onValue(msgRef, async (snapshot) => {
      if (snapshot.exists()) {
        const raw: Message[] = [];
        snapshot.forEach((child) => { raw.push({ id: child.key as string, ...child.val() }); });
        const key = channelKeyRef.current;
        const decrypted = await Promise.all(raw.map(async (m) => {
          if (m.sealed && key) {
            try { return { ...m, text: await openWithKey(key, { ciphertext: m.ciphertext!, iv: m.iv! }) }; }
            catch { return { ...m, text: "[cannot decrypt]" }; }
          }
          return m;
        }));
        setMessages(decrypted);
      } else setMessages([]);
    });
    return () => { unsubMsg(); };
  }, [currentGroup, username]);

  useEffect(() => {
    return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current); if (currentGroup && username) remove(ref(db, `groups/${currentGroup}/meta/typing/${username}`)); };
  }, [currentGroup, username]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newGroupName.trim()) return; setIsCreatingGroup(true);
    const grp = newGroupName.trim();
    if ((await get(ref(db, `groups/${grp}`))).exists()) { alert("Group name taken!"); setIsCreatingGroup(false); return; }
    const memberArray = newGroupMembers ? newGroupMembers.split(',').map(m => m.trim().replace(/^@/, '')).filter(Boolean) : [];
    for (const member of memberArray) { if (!(await get(ref(db, `users/${member}`))).exists()) { alert(`User @${member} not registered!`); setIsCreatingGroup(false); return; } }
    const passphrase = newGroupPassphrase.trim();
    const salt = passphrase ? generateSalt() : "";
    await set(ref(db, `groups/${grp}/meta`), { creator: username, members: memberArray.filter(m => m !== username), createdAt: Date.now(), ...(passphrase ? { sealed: true, salt } : {}) });
    if (passphrase) localStorage.setItem(`okshare_sg_${grp}`, passphrase);
    setCurrentGroup(grp); localStorage.setItem("okshare_group", grp); setNewGroupName(""); setNewGroupMembers(""); setNewGroupPassphrase(""); setIsCreatingGroup(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault(); if (!joinGroupName.trim()) return; setIsJoiningGroup(true);
    const grp = joinGroupName.trim(); const metaSnap = await get(ref(db, `groups/${grp}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username || meta.members?.includes(username)) {
        if (joinGroupPassphrase.trim()) localStorage.setItem(`okshare_sg_${grp}`, joinGroupPassphrase.trim());
        setCurrentGroup(grp); localStorage.setItem("okshare_group", grp); setJoinGroupName(""); setJoinGroupPassphrase("");
      } else alert("Not authorized.");
    } else alert("Group does not exist.");
    setIsJoiningGroup(false);
  };

  const handleSubmitPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupSalt || !pendingPassphrase.trim()) { alert("Enter the channel passphrase first!"); return; }
    try {
      const key = await deriveChannelKey(pendingPassphrase.trim(), groupSalt);
      localStorage.setItem(`okshare_sg_${currentGroup}`, pendingPassphrase.trim());
      setChannelKeyBoth(key); setNeedsPassphrase(false); setPendingPassphrase("");
    } catch { alert("Could not unlock with that passphrase."); }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this channel?")) return;
    const metaSnap = await get(ref(db, `groups/${currentGroup}/meta`));
    if (metaSnap.exists()) {
      const meta = metaSnap.val();
      if (meta.creator === username) {
        if (meta.members?.length > 0) await set(ref(db, `groups/${currentGroup}/meta`), { ...meta, creator: meta.members[0], members: meta.members.slice(1) });
        else await remove(ref(db, `groups/${currentGroup}`));
      } else await set(ref(db, `groups/${currentGroup}/meta/members`), meta.members.filter((m: string) => m !== username));
    }
    handleLeaveLocal();
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); if (!newMessageText.trim() || !currentGroup) return;
    if (isGroupSealed && !channelKeyRef.current) { alert("Unlock the channel passphrase first!"); return; }
    setIsSending(true);
    const text = newMessageText.trim();
    try {
      if (isGroupSealed && channelKeyRef.current) {
        const sealed = await sealWithKey(channelKeyRef.current, text);
        await push(ref(db, `groups/${currentGroup}/messages`), { sender: username, ...sealed, sealed: true, timestamp: Date.now() });
      } else {
        await push(ref(db, `groups/${currentGroup}/messages`), { sender: username, text, timestamp: Date.now() });
      }
      setNewMessageText("");
    } finally {
      setIsSending(false); clearTyping();
      if (typingTimerRef.current) { clearTimeout(typingTimerRef.current); typingTimerRef.current = null; }
    }
  };

  useEffect(() => {
    if (!currentGroup || !username || messages.length === 0) return;
    const myLastRead = lastReadBy[username] ?? 0;
    const newCount = messages.filter((m) => m.sender !== username && m.timestamp > myLastRead).length;
    if (newCount > 0) {
      const t = setTimeout(() => { set(ref(db, `groups/${currentGroup}/meta/lastRead/${username}`), Date.now()); }, 1500);
      return () => clearTimeout(t);
    }
  }, [messages, lastReadBy, currentGroup, username]);

  const othersReadMsg = (msg: Message) => {
    const others = groupMembersList.filter((m) => m !== username);
    return others.length > 0 && others.every((m) => (lastReadBy[m] ?? 0) >= msg.timestamp);
  };

  const unreadCount = messages.filter((m) => m.sender !== username && m.timestamp > (lastReadBy[username] ?? 0)).length;

  if (!username) return <div className="bg-surface2 border border-accent/30 rounded-lg p-6 text-center font-mono text-accent text-sm">Please register a username first!</div>;

  if (!currentGroup) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <form onSubmit={handleCreateGroup} className="bg-surface2/60 border border-edge rounded-lg p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">Create New Group</h2>
        <div>
          <label className="text-xs text-muted block mb-1.5 font-semibold">Group Name</label>
          <input type="text" placeholder="e.g. project-alpha" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full rounded-md p-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5 font-semibold">Add Registered Friends</label>
          <input type="text" placeholder="e.g. alice, bob" value={newGroupMembers} onChange={(e) => setNewGroupMembers(e.target.value)} className="w-full rounded-md p-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5 font-semibold">Channel Passphrase (optional)</label>
          <input type="password" placeholder="e.g. blue-mango-42" value={newGroupPassphrase} onChange={(e) => setNewGroupPassphrase(e.target.value)} className="w-full rounded-md p-2.5 text-sm" />
          <p className="text-[11px] text-muted mt-1.5">Messages get encrypted end-to-end. Share the passphrase with members outside this app.</p>
        </div>
        <button type="submit" disabled={isCreatingGroup} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-2.5 rounded-md font-semibold transition-colors text-sm">
          {isCreatingGroup ? "Creating..." : "Create & Enter Group"}
        </button>
      </form>
      <form onSubmit={handleJoinGroup} className="bg-surface2/60 border border-edge rounded-lg p-5 space-y-4">
        <h2 className="text-base font-bold text-ink">Enter Existing Group</h2>
        <div>
          <label className="text-xs text-muted block mb-1.5 font-semibold">Group Name</label>
          <input type="text" placeholder="e.g. project-alpha" value={joinGroupName} onChange={(e) => setJoinGroupName(e.target.value)} className="w-full rounded-md p-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1.5 font-semibold">Passphrase (if channel is encrypted)</label>
          <input type="password" placeholder="e.g. blue-mango-42" value={joinGroupPassphrase} onChange={(e) => setJoinGroupPassphrase(e.target.value)} className="w-full rounded-md p-2.5 text-sm" />
        </div>
        <p className="text-xs text-muted pt-6">If the group does not exist or you are not a member, entry will be blocked.</p>
        <button type="submit" disabled={isJoiningGroup} className="w-full bg-surface2 hover:bg-edge text-ink border border-edge py-2.5 rounded-md font-semibold transition-colors text-sm">
          {isJoiningGroup ? "Checking..." : "Enter Channel"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center bg-surface2/60 p-3 rounded-lg border border-edge text-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className="text-ok font-bold">#{currentGroup}</span>
          {isGroupSealed && <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">🔒 E2E</span>}
          <span className="text-muted text-xs truncate">Members: {groupMembersList.join(", ") || "none"}</span>
          {typingUsers.length > 0 && <span className="text-ok text-xs animate-pulse">✍ {typingUsers.join(", ")} typing…</span>}
          {unreadCount > 0 && <span className="text-accent text-xs font-bold">● {unreadCount} new</span>}
        </div>
        <button onClick={handleLeaveGroup} className="text-accent text-xs font-semibold underline self-start sm:self-auto">
          Leave Channel
        </button>
      </div>

      {isGroupSealed && needsPassphrase && !channelKey && (
        <form onSubmit={handleSubmitPassphrase} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-accent-soft border border-accent/40 rounded-lg p-3">
          <span className="text-xs font-mono font-bold text-accent tracking-wider whitespace-nowrap">ENCRYPTED CHANNEL</span>
          <input type="password" value={pendingPassphrase} onChange={(e) => setPendingPassphrase(e.target.value)} placeholder="Enter channel passphrase..." className="flex-1 rounded-md p-2 text-center text-sm font-mono" />
          <button type="submit" className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm font-semibold">Unlock</button>
        </form>
      )}

      <div className="h-[55vh] md:h-[520px] bg-surface2/60 border border-edge rounded-lg p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-muted pt-24 text-sm">No messages in this workspace yet. Send the first update!</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender === username;
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div className="text-xs text-muted mb-1 flex items-center gap-1">
                  <span>@{msg.sender} - {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && <span className="text-[10px] text-faint" title={othersReadMsg(msg) ? "Read by all members" : "Sent"}>
                    {othersReadMsg(msg) ? "✓✓" : "✓"}
                  </span>}
                  {!!msg.text && (
                    <button onClick={() => speakText(msg.text!)} className="hover:text-accent transition-colors" title="Read aloud">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className={`p-3 rounded-lg max-w-full lg:max-w-[85%] text-sm relative group border ${isMine ? "bg-accent-soft border-accent/30 text-ink" : "bg-surface border-edge text-ink"}`}>
                  <div className="max-w-none"><RenderContent content={msg.text ?? ""} onOpenCompiler={onOpenCompiler} /></div>
                  {isMine && (
                    <button onClick={() => remove(ref(db, `groups/${currentGroup}/messages/${msg.id}`))} className="absolute -top-2 -right-2 bg-accent hover:bg-accent-hover text-white text-[10px] px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow" title="Delete message">✕</button>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex items-end gap-2">
        <textarea
          value={newMessageText}
          onChange={(e) => { setNewMessageText(e.target.value); handleTyping(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          onBlur={clearTyping}
          placeholder={isGroupSealed && !channelKey ? "Unlock the channel to send messages" : "Type update (Shift+Enter for new line)"}
          className="flex-1 min-h-[48px] max-h-[150px] rounded-lg p-3 font-mono text-sm resize-none"
          rows={2}
        />
        <button type="button" onClick={onOpenDictation} className="h-[48px] w-12 shrink-0 bg-surface2 hover:bg-edge text-ink border border-edge rounded-lg transition-colors flex items-center justify-center" title="Dictate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </button>
        <button type="submit" disabled={isSending} className="h-[48px] px-5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          Send
        </button>
      </form>
    </div>
  );
}