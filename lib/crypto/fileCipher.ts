import { base64ToBuffer, bufferToBase64, derivePinKey } from "./secretCipher";
import type { FileKind, SealedSecretLike } from "@/lib/types";

export const FILE_CAP_BYTES = 5 * 1024 * 1024;
export const MAX_COMBINED_FILE_BYTES = 8 * 1024 * 1024;

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);
const DOCUMENT_EXTS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "md",
  "csv",
]);
const CODE_EXTS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "c",
  "cpp",
  "h",
  "hpp",
  "java",
  "rb",
  "go",
  "rs",
  "php",
  "html",
  "css",
  "json",
  "sh",
  "yml",
  "yaml",
  "sql",
]);

export function classifyFileName(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXTS.has(ext)) return "image";
  if (DOCUMENT_EXTS.has(ext)) return "document";
  if (CODE_EXTS.has(ext)) return "code";
  return "other";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKindLabel(kind: FileKind): string {
  switch (kind) {
    case "image":
      return "IMG";
    case "document":
      return "DOC";
    case "code":
      return "CODE";
    default:
      return "FILE";
  }
}

export async function sealBytesWithKey(
  key: CryptoKey,
  bytes: ArrayBuffer,
): Promise<{ iv: string; bytes: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { iv: bufferToBase64(iv), bytes: cipher };
}

export async function openBytesWithKey(
  key: CryptoKey,
  iv: string,
  cipherBytes: BufferSource,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBuffer(iv) }, key, cipherBytes);
}

export async function sealBytesWithPin(
  bytes: ArrayBuffer,
  pin: string,
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePinKey(pin, bufferToBase64(salt));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return {
    ciphertext: bufferToBase64(cipher),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

export async function openBytesWithPin(sealed: SealedSecretLike, pin: string): Promise<ArrayBuffer> {
  const key = await derivePinKey(pin, sealed.salt);
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(sealed.iv) },
    key,
    base64ToBuffer(sealed.ciphertext),
  );
}

async function compressImage(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file);
    let width = bitmap.width;
    let height = bitmap.height;
    let best: Blob | null = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return best;
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.82),
      );
      if (blob && blob.size <= FILE_CAP_BYTES) return blob;
      if (blob && (!best || blob.size < best.size)) best = blob;

      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      if (width < 64 || height < 64) break;
    }
    return best;
  } catch {
    return null;
  }
}

export type PrepareOutcome = { ok: true; file: File } | { ok: false; rejected: string };

export async function prepareSharedFile(file: File): Promise<PrepareOutcome> {
  if (file.size <= FILE_CAP_BYTES) return { ok: true, file };

  if (classifyFileName(file.name) !== "image") {
    return { ok: false, rejected: `"${file.name}" exceeds the 5 MB limit for non-image files.` };
  }

  const compressed = await compressImage(file);
  if (compressed) {
    const renamed = new File([compressed], file.name, { type: compressed.type });
    if (renamed.size <= FILE_CAP_BYTES) return { ok: true, file: renamed };
  }
  return { ok: false, rejected: `"${file.name}" could not be compressed to fit under 5 MB.` };
}