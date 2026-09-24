# OK-Share

Ephemeral, encrypted sharing for text, code, and group chats — built for friends who want things to disappear after they're said.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![Firebase RTDB](https://img.shields.io/badge/Firebase-RealtimeDB-ffca28) ![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8)

## Features

### 🔥 Ephemeral Pastebin
- **Burn-after-reading** secrets that are deleted from the database the moment they're shared.
- **Passcode-protected secrets** — text is **AES-256-GCM encrypted in the browser** before it ever touches Firebase. The key is derived from your passcode (PBKDF2, 150k iterations); only `salt + iv + ciphertext` are stored. No plaintext, no passcode, ever.
- **Auto-burn after N views** — the share link destroys itself once it's been opened a set number of times.
- Live "matrix rain" effect while locked, with a decryption countdown on burn.

### 👥 Group Workspaces
- Temporary channels for a handful of registered friends.
- **E2E-encrypted channels** (optional) — set a channel passphrase and every message is encrypted before it's stored. The passphrase is shared out-of-band and never saved to the DB.
- **WhatsApp-style read receipts** — `✓` sent, `✓✓` read by all members.
- **Typing indicators** and **unread counts** on re-entry.

### 🤖 AI Code Tools (Groq)
- Every code block has an **Explain** dropdown with five modes: syntax check, simple English, short summary, super-detailed, and Bangla.
- **Check Syntax** mode scans the code for syntax errors and lists each one with a suggested fix.
- **Run** — compile and execute the code live in the browser via the Code Runner studio.

### 🎙️ Extras
- Voice **dictation** for pastes and chat messages.
- Matrix rain, flying-plane, and detonation animations.
- Light/dark theme toggle.

## How it works (security model)

Client → Firebase Realtime Database, everything visible to you is plaintext; everything you want protected is encrypted client-side before write:

| Data | At rest in Firebase |
| --- | --- |
| Unprotected paste | plaintext `text` |
| Passcode-protected paste | `{ salt, iv, ciphertext }` + AES-256-GCM blob, the passcode derives the key in your browser |
| Group channel messages | opt-in `{ salt, iv, ciphertext }` per message when the channel has a passphrase |
| Group meta (members, typing, read receipts) | plaintext metadata |

Passcode-protected secrets and passphrased channels use WebCrypto (`crypto.subtle`), so the app must run over **HTTPS** (or `localhost`).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Where | Required |
| --- | --- | --- |
| `GROQ_API_KEY` | `.env.local` | Yes, for Explain/Check-Syntax |
| Firebase config | `lib/firebase/config.ts` | Yes, paste your own RTDB config |

```bash
# .env.local
GROQ_API_KEY=gsk_your_key
```

> ℹ️ The Firebase web API key is public by design (it ships to the browser). The real gate is your **Realtime Database Security Rules** — since OK-Share reads/writes straight from the client, start with rules locked to your project or its public `pastebin/` + `groups/` paths as you see fit.

### Production build

```bash
npm run build
npm run start
```

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **Tailwind CSS 4**
- **Firebase Realtime Database** (client SDK)
- **Groq API** (`openai/gpt-oss-120b`) for code explain + syntax checking
- **WebCrypto** (PBKDF2 + AES-256-GCM) for client-side encryption
- **highlight.js** for code highlighting