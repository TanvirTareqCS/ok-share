"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DownloadIcon } from "@/components/icons/ActionIcons";
import { base64ToBuffer } from "@/lib/crypto/secretCipher";
import { fileKindLabel, formatFileSize, openBytesWithKey, openBytesWithPin } from "@/lib/crypto/fileCipher";
import type { FileKind } from "@/lib/types";

const TEXT_PREVIEW_BYTES = 256 * 1024;

interface Props {
  name: string;
  size: number;
  kind: FileKind;
  data?: string;
  salt?: string;
  iv?: string;
  ciphertext?: string;
  channelKey?: CryptoKey | null;
  pin?: string;
}

function sniffImageType(bytes: Uint8Array): string | null {
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "image/bmp";
  }
  return null;
}

function blobTypeForName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/plain",
    csv: "text/csv",
    js: "text/javascript",
    jsx: "text/javascript",
    ts: "text/plain",
    tsx: "text/plain",
    py: "text/plain",
    c: "text/plain",
    cpp: "text/plain",
    h: "text/plain",
    hpp: "text/plain",
    java: "text/plain",
    rb: "text/plain",
    go: "text/plain",
    rs: "text/plain",
    php: "text/plain",
    html: "text/html",
    css: "text/css",
    json: "application/json",
    sh: "text/plain",
    yml: "text/plain",
    yaml: "text/plain",
    sql: "text/plain",
  };
  return map[ext] ?? "application/octet-stream";
}

export default function SharedFileView({
  name,
  size,
  kind,
  data,
  salt,
  iv,
  ciphertext,
  channelKey,
  pin,
}: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const bytesRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const retriedRef = useRef(false);
  const attemptedRef = useRef(false);

  const isImage = kind === "image";
  const isPdf = kind === "document" && /\.pdf$/i.test(name);
  const isTextual = kind === "code" || (kind === "document" && /\.(txt|md|csv)$/i.test(name));
  const canView = isImage || isPdf || isTextual;
  const canUnlock = Boolean(
    data || (iv && ciphertext && (channelKey || (salt && pin))),
  );

  const decryptOnce = useCallback(async (): Promise<string | null> => {
    if (objectUrlRef.current) return objectUrlRef.current;
    if (!canUnlock) return null;
    setIsLoading(true);
    setHasError(false);
    try {
      let plain: ArrayBuffer | Uint8Array<ArrayBuffer>;
      if (data) {
        plain = base64ToBuffer(data);
      } else if (iv && ciphertext && channelKey) {
        plain = await openBytesWithKey(channelKey, iv, base64ToBuffer(ciphertext));
      } else if (iv && ciphertext && salt && pin) {
        plain = await openBytesWithPin({ ciphertext, salt, iv }, pin);
      } else {
        throw new Error("Missing decryption key");
      }
      const bytes = plain instanceof Uint8Array ? plain : new Uint8Array(plain);
      bytesRef.current = bytes;
      if (isTextual && bytes.byteLength <= TEXT_PREVIEW_BYTES) {
        setTextPreview(new TextDecoder().decode(bytes));
      }
      const blobType = isImage
        ? sniffImageType(bytes) ?? blobTypeForName(name)
        : blobTypeForName(name);
      const url = URL.createObjectURL(new Blob([bytes], { type: blobType }));
      objectUrlRef.current = url;
      setObjectUrl(url);
      return url;
    } catch {
      setHasError(true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [canUnlock, data, iv, ciphertext, channelKey, salt, pin, isTextual, isImage, name]);

  const handleDownload = useCallback(async () => {
    const url = await decryptOnce();
    if (!url) return;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [name, decryptOnce]);

  const handleView = useCallback(async () => {
    const url = await decryptOnce();
    if (url) setIsOpen(true);
  }, [decryptOnce]);

  const handleImageError = useCallback(() => {
    if (!bytesRef.current || retriedRef.current) {
      setHasError(true);
      return;
    }
    retriedRef.current = true;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const blobType = sniffImageType(bytesRef.current) ?? blobTypeForName(name);
    const url = URL.createObjectURL(new Blob([bytesRef.current], { type: blobType }));
    objectUrlRef.current = url;
    setObjectUrl(url);
  }, [name]);

  useEffect(() => {
    attemptedRef.current = false;
  }, [data, iv, ciphertext, salt, pin, channelKey]);

  useEffect(() => {
    if (isImage && canUnlock && !attemptedRef.current) {
      attemptedRef.current = true;
      void decryptOnce();
    }
  }, [isImage, canUnlock, decryptOnce]);

  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const closeView = () => setIsOpen(false);

  const showThumb = isImage && objectUrl && !hasError;

  return (
    <>
      {showThumb ? (
        <div className="flex flex-col items-start gap-2">
          <button type="button" onClick={() => setIsOpen(true)} className="block" title="Click to enlarge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={objectUrl} alt={name} onError={handleImageError} className="max-w-[280px] cursor-zoom-in rounded-lg border border-edge" />
          </button>
          <div className="flex items-center gap-2 w-full">
            <span className="truncate font-mono text-xs text-muted">{name}</span>
            <button
              onClick={handleDownload}
              className="ml-auto shrink-0 inline-flex items-center gap-1 bg-surface hover:bg-edge text-ink border border-edge px-2 py-1 rounded-md text-[10px] font-semibold transition-colors"
            >
              <DownloadIcon />
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="inline-flex max-w-full items-stretch border border-edge rounded-lg overflow-hidden bg-surface2/60">
          <button
            type="button"
            onClick={canView ? handleView : undefined}
            disabled={!canView || !canUnlock}
            title={canView ? "Click to view in big screen" : undefined}
            className={`flex min-w-0 items-center gap-2 px-3 py-2 text-left ${
              canView && canUnlock ? "cursor-pointer hover:bg-edge/50" : "cursor-default"
            } disabled:cursor-default`}
          >
            <span className="shrink-0 text-[10px] font-bold uppercase text-ok bg-ok/10 border border-ok/30 rounded px-1.5 py-0.5">
              {fileKindLabel(kind)}
            </span>
            <span className={`truncate font-mono text-sm text-ink ${canView && canUnlock ? "underline decoration-dotted underline-offset-2" : ""}`}>
              {name}
            </span>
            <span className="shrink-0 text-[10px] text-faint">
              {formatFileSize(size)}
              {!canUnlock && " · locked"}
            </span>
          </button>
          <div className="flex shrink-0 items-center border-l border-edge px-2">
            {isLoading ? (
              <span className="text-[10px] font-mono text-accent animate-pulse">DECRYPTING...</span>
            ) : hasError ? (
              <span className="text-[10px] font-mono text-accent">FAILED</span>
            ) : (
              <button
                type="button"
                onClick={handleDownload}
                disabled={!canUnlock}
                title="Download"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                <DownloadIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen &&
        objectUrl &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            onClick={closeView}
          >
          <button
            type="button"
            onClick={closeView}
            className="absolute top-4 right-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg hover:bg-slate-200 transition-colors text-base font-bold"
            title="Close"
          >
            ✕
          </button>
          {isImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={objectUrl}
              alt={name}
              onError={handleImageError}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl"
            />
          )}
          {isPdf && (
            <iframe
              src={objectUrl}
              title={name}
              onClick={(event) => event.stopPropagation()}
              className="h-[85vh] w-full max-w-4xl rounded-lg bg-white"
            />
          )}
          {isTextual &&
            (textPreview !== null ? (
              <pre
                onClick={(event) => event.stopPropagation()}
                className="h-[85vh] w-full max-w-4xl overflow-auto rounded-lg bg-surface p-4 text-sm text-ink whitespace-pre-wrap break-words"
              >
                {textPreview}
              </pre>
            ) : (
              <div onClick={(event) => event.stopPropagation()} className="rounded-lg bg-surface p-6 text-center">
                <p className="text-sm text-ink mb-3">Preview not available for this file size.</p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 bg-accent hover:bg-accent-hover text-white px-3 py-2 rounded-md text-xs font-semibold transition-colors"
                >
                  <DownloadIcon />
                  Download
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}