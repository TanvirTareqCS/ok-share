"use client";

import CreateGroupForm from "./CreateGroupForm";
import GroupComposer from "./GroupComposer";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import JoinGroupForm from "./JoinGroupForm";
import ManageMembersPanel from "./ManageMembersPanel";
import PassphraseGate from "./PassphraseGate";
import { useGroupChannel } from "./useGroupChannel";
import { useGroupMembership } from "./useGroupMembership";
import { useGroupPresence } from "./useGroupPresence";
import { useCallback, useState } from "react";
import { describeMessageForReply, isUndecryptable, truncateForPreview } from "@/lib/types";
import type { GroupMessage, ReplyTarget } from "@/lib/types";

interface Props {
  username: string;
  currentGroup: string;
  setCurrentGroup: (groupName: string) => void;
  newMessageText: string;
  setNewMessageText: React.Dispatch<React.SetStateAction<string>>;
  onOpenDictation: () => void;
  onOpenCompiler: (code: string, language: string) => void;
}

export default function GroupWorkspace({
  username,
  currentGroup,
  setCurrentGroup,
  newMessageText,
  setNewMessageText,
  onOpenDictation,
  onOpenCompiler,
}: Props) {
  const [manageOpen, setManageOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const handleGroupClosed = useCallback(() => {
    setReplyTarget(null);
    setHighlightedId(null);
    setCurrentGroup("");
  }, [setCurrentGroup]);

  const channel = useGroupChannel({
    username,
    groupName: currentGroup,
    onGroupClosed: handleGroupClosed,
  });

  const handleGroupEntered = useCallback(
    (groupName: string) => {
      setManageOpen(false);
      setPendingFile(null);
      setReplyTarget(null);
      setHighlightedId(null);
      setCurrentGroup(groupName);
    },
    [setCurrentGroup],
  );

  const membership = useGroupMembership({
    username,
    onGroupEntered: handleGroupEntered,
  });

  const presence = useGroupPresence({
    username,
    groupName: currentGroup,
    messages: channel.messages,
    members: channel.members,
    lastReadBy: channel.lastReadBy,
    typingMap: channel.typingMap,
  });

  const handleReply = useCallback((message: GroupMessage) => {
    setHighlightedId(null);
    setReplyTarget({
      id: message.id,
      sender: message.sender,
      preview: truncateForPreview(describeMessageForReply(message)),
    });
  }, []);

  const handleCancelReply = useCallback(() => setReplyTarget(null), []);

  const handleJumpToMessage = useCallback((messageId: string) => {
    setHighlightedId(messageId);
    window.setTimeout(() => {
      setHighlightedId((current) => (current === messageId ? null : current));
    }, 1500);
  }, []);

  const handleSend = async () => {
    const isSent = await channel.sendMessage(
      newMessageText,
      pendingFile,
      replyTarget ? { id: replyTarget.id, sender: replyTarget.sender } : null,
    );
    if (!isSent) return;

    setNewMessageText("");
    setPendingFile(null);
    setReplyTarget(null);
    presence.stopTyping();
  };

  const handleLeave = async () => {
    setManageOpen(false);
    await channel.leaveGroup();
  };

  if (!username) {
    return (
      <div className="bg-surface2 border border-accent/30 rounded-lg p-6 text-center font-mono text-accent text-sm">
        Please register a username first!
      </div>
    );
  }

  if (!currentGroup) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CreateGroupForm isCreating={membership.isCreating} onCreate={membership.createGroup} />
        <JoinGroupForm isJoining={membership.isJoining} onJoin={membership.joinGroup} />
      </div>
    );
  }

  const isLocked = channel.isSealed && !channel.channelKey;
  const hasUndecryptable = channel.isSealed && channel.messages.some(isUndecryptable);

  return (
    <div className="space-y-4">
      <GroupHeader
        groupName={currentGroup}
        members={channel.members}
        isSealed={channel.isSealed}
        isCreator={channel.isCreator}
        isAdmin={channel.isAdmin}
        manageOpen={manageOpen}
        onToggleManage={() => setManageOpen((open) => !open)}
        unreadCount={presence.unreadCount}
        onLeave={handleLeave}
      />

      {manageOpen && (channel.isCreator || channel.isAdmin) && (
        <ManageMembersPanel
          groupName={currentGroup}
          members={channel.members}
          admins={channel.admins}
          isCreator={channel.isCreator}
          isAdmin={channel.isAdmin}
          isSealed={channel.isSealed}
          isManaging={membership.isManaging}
          onAddMembers={(memberInput) => membership.addMembers(currentGroup, memberInput)}
          onRemoveMember={(memberName) => membership.removeMember(currentGroup, memberName)}
          onPromoteMember={(memberName) => membership.promoteMember(currentGroup, memberName)}
          onDemoteMember={(memberName) => membership.demoteMember(currentGroup, memberName)}
        />
      )}

      {hasUndecryptable && (
        <div className="flex items-center justify-between gap-2 bg-surface2/60 border border-accent/40 rounded-lg px-3 py-2 text-xs text-muted">
          <span>
            Some messages can&apos;t be decrypted with the current passphrase. Re-enter it to read
            them.
          </span>
          <button
            onClick={channel.reenter}
            className="text-accent font-semibold underline whitespace-nowrap"
          >
            Re-enter passphrase
          </button>
        </div>
      )}

      {channel.isSealed && channel.needsPassphrase && !channel.channelKey && (
        <PassphraseGate onUnlock={channel.unlock} />
      )}

      <GroupMessageList
        messages={channel.messages}
        username={username}
        channelKey={channel.channelKey}
        typingUsers={presence.typingUsers}
        replyTargetId={replyTarget?.id ?? null}
        highlightedId={highlightedId}
        onOpenCompiler={onOpenCompiler}
        onDeleteMessage={channel.deleteMessage}
        onReply={handleReply}
        onJumpToMessage={handleJumpToMessage}
        isReadByEveryone={presence.hasReadByEveryone}
      />

      <GroupComposer
        text={newMessageText}
        isSending={channel.isSending}
        isLocked={isLocked}
        canAttach={!isLocked}
        file={pendingFile}
        replyTarget={replyTarget}
        onTextChange={(text) => {
          setNewMessageText(text);
          presence.notifyTyping();
        }}
        onSend={handleSend}
        onOpenDictation={onOpenDictation}
        onPickFile={setPendingFile}
        onClearFile={() => setPendingFile(null)}
        onStopTyping={presence.stopTyping}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}
