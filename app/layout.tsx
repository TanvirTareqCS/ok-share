import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OK-Share",
  description: "Burn-after-reading text and code snippets with encrypted group workspaces.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='okshare_theme';var t=localStorage.getItem(k);if(!t){t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';localStorage.setItem(k,t);}document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light');}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body className="bg-bg text-ink antialiased">{children}</body>
    </html>
  );
}