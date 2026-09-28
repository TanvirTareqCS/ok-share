const encoder = new TextEncoder();
const decoder = new TextDecoder();

const PBKDF2_ITERATIONS = 150000;

export const CHANNEL_VERIFY_TEXT = "okshare-channel-verify";

export interface SealedSecret {
  ciphertext: string;
  salt: string;
  iv: string;
}

export interface SealedMessage {
  ciphertext: string;
  iv: string;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function generateSalt(): string {
  return bufferToBase64(crypto.getRandomValues(new Uint8Array(16)));
}

async function deriveKeyFromSalt(passcode: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const passKey = await crypto.subtle.importKey("raw", encoder.encode(passcode), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSecret(plaintext: string, passcode: string): Promise<SealedSecret> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromSalt(passcode, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  return { ciphertext: bufferToBase64(cipher), salt: bufferToBase64(salt), iv: bufferToBase64(iv) };
}

export async function decryptSecret(secret: SealedSecret, passcode: string): Promise<string> {
  const key = await deriveKeyFromSalt(passcode, base64ToBuffer(secret.salt));
  return openWithKey(key, secret);
}

export async function deriveChannelKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  return deriveKeyFromSalt(passphrase, base64ToBuffer(saltB64));
}

export async function sealWithKey(key: CryptoKey, plaintext: string): Promise<SealedMessage> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  return { ciphertext: bufferToBase64(cipher), iv: bufferToBase64(iv) };
}

export async function openWithKey(key: CryptoKey, payload: SealedMessage): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuffer(payload.iv) },
    key,
    base64ToBuffer(payload.ciphertext)
  );
  return decoder.decode(plain);
}

export async function createChannelCheck(key: CryptoKey): Promise<SealedMessage> {
  return sealWithKey(key, CHANNEL_VERIFY_TEXT);
}

export async function verifyChannelCheck(key: CryptoKey, check: SealedMessage): Promise<boolean> {
  try {
    return (await openWithKey(key, check)) === CHANNEL_VERIFY_TEXT;
  } catch {
    return false;
  }
}