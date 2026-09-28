const GROUP_PASSPHRASE_PREFIX = "okshare_sg_";

export const STORAGE_KEYS = {
  username: "okshare_username",
  activeGroup: "okshare_group",
  theme: "okshare_theme",
  groupPassphrase: (groupName: string) => `${GROUP_PASSPHRASE_PREFIX}${groupName}`,
} as const;
