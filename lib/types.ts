export type ExplainMode = "SYNTAX" | "ADIB" | "FABIHA" | "MAHATAB" | "MAHIN";

export const UNDECRYPTABLE_MARKER = "[cannot decrypt]";

export function isUndecryptable(message: GroupMessage): boolean {
  return message.text === UNDECRYPTABLE_MARKER;
}

export type FileKind = "image" | "document" | "code" | "other";

export interface FileAttachment {
  name: string;
  size: number;
  kind: FileKind;
  iv: string;
  ciphertext: string;
}

export interface SharedFile {
  name: string;
  size: number;
  kind: FileKind;
  data?: string;
  salt?: string;
  iv?: string;
  ciphertext?: string;
}

export interface SealedSecretLike {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface AttachmentDraft {
  id: string;
  name: string;
  size: number;
  kind: FileKind;
  file: File;
}

export const REPLY_TARGET_MISSING = "[original message unavailable]";

/** Stored on a message so a reply can point at its parent. Plaintext-safe. */
export interface MessageReplyRef {
  id: string;
  sender: string;
}

/** Local composer state for the message currently being replied to. */
export interface ReplyTarget extends MessageReplyRef {
  preview: string;
}

export interface GroupMessage {
  id: string;
  sender: string;
  text?: string;
  timestamp: number;
  sealed?: boolean;
  ciphertext?: string;
  iv?: string;
  attachment?: FileAttachment;
  replyTo?: MessageReplyRef;
}

export function describeMessageForReply(message: GroupMessage): string {
  if (message.text && !isUndecryptable(message)) return message.text;
  if (message.attachment) return `📎 ${message.attachment.name}`;
  return isUndecryptable(message) ? UNDECRYPTABLE_MARKER : REPLY_TARGET_MISSING;
}

export function truncateForPreview(value: string, maxLength = 120): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > maxLength ? `${collapsed.slice(0, maxLength - 1)}…` : collapsed;
}

export interface SharedSecret {
  text?: string;
  sealed?: boolean;
  ciphertext?: string;
  salt?: string;
  iv?: string;
  files?: SharedFile[];
  check?: { ciphertext: string; iv: string };
  checkSalt?: string;
  views?: number;
  maxViews?: number;
  createdAt?: number;
}

export interface GroupMeta {
  creator: string;
  members: string[];
  admins?: string[];
  createdAt: number;
  sealed?: boolean;
  salt?: string;
  check?: {
    ciphertext: string;
    iv: string;
  };
  typing?: Record<string, number>;
  lastRead?: Record<string, number>;
}

export type CompilerLanguageId =
  | "python-3.14"
  | "typescript-deno"
  | "g++-15"
  | "dotnet-csharp-9"
  | "ruby-4.0"
  | "openjdk-25";

export interface CompileResult {
  status?: string;
  output?: string;
  error?: string;
}
