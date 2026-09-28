"use client";
import "highlight.js/styles/vs2015.css";
import CodeBlockView from "./CodeBlockView";
import { parseCodeFences } from "./codeFence";

interface Props {
  content: string;
  onOpenCompiler: (code: string, language: string) => void;
  isReceiver?: boolean;
}

export default function RichText({ content, onOpenCompiler, isReceiver = false }: Props) {
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("Code copied to clipboard!");
  };

  return (
    <>
      {parseCodeFences(content).map((segment, index) =>
        segment.kind === "text" ? (
          <span key={`text-${index}`} className="whitespace-pre-wrap">
            {segment.value}
          </span>
        ) : (
          <CodeBlockView
            key={`code-${index}`}
            code={segment.code}
            language={segment.language}
            isReceiver={isReceiver}
            onOpenCompiler={onOpenCompiler}
            onCopyCode={handleCopyCode}
          />
        ),
      )}
    </>
  );
}
