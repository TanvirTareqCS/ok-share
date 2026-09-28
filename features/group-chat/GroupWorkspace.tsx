"use client";

import CreateGroupForm from "./CreateGroupForm";
import GroupComposer from "./GroupComposer";
import GroupHeader from "./GroupHeader";
import GroupMessageList from "./GroupMessageList";
import JoinGroupForm from "./JoinGroupForm";
import PassphraseGate from "./PassphraseGate";
import { useGroupChannel } from "./useGroupChannel";
import { useGroupMembership } from "./useGroupMembership";
import { useGroupPresence } from "./useGroupPresence";

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
  const channel = useGroupChannel({
    username,
    groupName: currentGroup,
    onGroupClosed: () => setCurrentGroup(""),
  });

  const membership = useGroupMembership({
    username,
    onGroupEntered: setCurrentGroup,
  });

  const presence = useGroupPresence({
    username,
    groupName: currentGroup,
    messages: channel.messages,
    members: channel.members,
    lastReadBy: channel.lastReadBy,
    typingMap: channel.typingMap,
  });

  const handleSend = async () => {
    const isSent = await channel.sendMessage(newMessageText);
    if (!isSent) return;

    setNewMessageText("");
    presence.stopTyping();
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

  return (
    <div className="space-y-4">
      <GroupHeader
        groupName={currentGroup}
        members={channel.members}
        isSealed={channel.isSealed}
        typingUsers={presence.typingUsers}
        unreadCount={presence.unreadCount}
        onLeave={channel.leaveGroup}
      />

      {channel.isSealed && channel.needsPassphrase && !channel.channelKey && (
        <PassphraseGate onUnlock={channel.unlock} />
      )}

      <GroupMessageList
        messages={channel.messages}
        username={username}
        onOpenCompiler={onOpenCompiler}
        onDeleteMessage={channel.deleteMessage}
        isReadByEveryone={presence.hasReadByEveryone}
      />

      <GroupComposer
        text={newMessageText}
        isSending={channel.isSending}
        isLocked={isLocked}
        onTextChange={(text) => {
          setNewMessageText(text);
          presence.notifyTyping();
        }}
        onSend={handleSend}
        onOpenDictation={onOpenDictation}
        onStopTyping={presence.stopTyping}
      />
    </div>
  );
}
