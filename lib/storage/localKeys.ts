const GROUP_PASSPHRASE_PREFIX = "okshare_sg_";

export const STORAGE_KEYS = {
  username: "okshare_username",
  activeGroup: "okshare_group",
  theme: "okshare_theme",
  groupPassphrase: (groupName: string) => `${GROUP_PASSPHRASE_PREFIX}${groupName}`,
} as const;

export function clearGroupPassphrases(): void {
  if (typeof window === "undefined") return;

  const staleKeys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(GROUP_PASSPHRASE_PREFIX)) staleKeys.push(key);
  }

  staleKeys.forEach((key) => localStorage.removeItem(key));
}
