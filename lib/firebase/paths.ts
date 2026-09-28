export const DB_PATHS = {
  users: "users",
  user: (username: string) => `users/${username}`,

  allGroups: "groups",
  group: (groupName: string) => `groups/${groupName}`,
  groupMeta: (groupName: string) => `groups/${groupName}/meta`,
  groupMembers: (groupName: string) => `groups/${groupName}/meta/members`,
  groupTyping: (groupName: string) => `groups/${groupName}/meta/typing`,
  typingIndicator: (groupName: string, username: string) =>
    `groups/${groupName}/meta/typing/${username}`,
  lastReadReceipt: (groupName: string, username: string) =>
    `groups/${groupName}/meta/lastRead/${username}`,

  groupMessages: (groupName: string) => `groups/${groupName}/messages`,
  groupMessage: (groupName: string, messageId: string) =>
    `groups/${groupName}/messages/${messageId}`,

  secret: (secretId: string) => `pastebin/${secretId}`,
} as const;
