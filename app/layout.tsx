import type { Metadata } from "next";
import "./globals.css";
import { STORAGE_KEYS } from "@/lib/storage/localKeys";

export const metadata: Metadata = {
  title: "OK-Share",
  description: "Burn-after-reading text and code snippets with encrypted group workspaces.",
};

const THEME_STORAGE_KEY = STORAGE_KEYS.theme;

const themeBootstrapScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';localStorage.setItem(k,t);}document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}
