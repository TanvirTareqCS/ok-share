"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import hljs from "highlight.js";
import ExplainDropdown from "./ExplainDropdown";

const syntaxCache = new Map<string, Promise<string>>();

function runSyntaxCheck(code: string): Promise<string> {
  const key = code;
  const cached = syntaxCache.get(key);
  if (cached) return cached;
  const promise = fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, mode: "SYNTAX" })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);
      return data.explanation as string;
    })
    .catch(() => "Syntax check unavailable.");
  syntaxCache.set(key, promise);
  return promise;
}

interface Props {
  code: string;
  lang: string;
  isReceiver: boolean;
  onOpenCompiler: (code: string, lang: string) => void;
  onCopyCode: (code: string) => void;
}

export default function CodeBlock({ code, lang, isReceiver, onOpenCompiler, onCopyCode }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);

  const [syntaxReport, setSyntaxReport] = useState<string | null>(null);
  const [syntaxState, setSyntaxState] = useState<"idle" | "checking" | "done">("idle");
  const [syntaxOpen, setSyntaxOpen] = useState(false);
  const syntaxCheckedRef = useRef(false);

  const codePreRef = useRef<HTMLPreElement>(null);
  const [calculatedHeight, setCalculatedHeight] = useState<string>("250px");

  const handleExplain = async (mode: string) => {
    setIsLoading(true);
    setActiveMode(mode);
    setExplanation(null);
    try {
      if (mode === "SYNTAX") {
        setExplanation(await runSyntaxCheck(code));
      } else {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, mode })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      setExplanation(`Error: ${err.message}`);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (syntaxCheckedRef.current) return;
    syntaxCheckedRef.current = true;
    let active = true;
    setSyntaxState("checking");
    runSyntaxCheck(code).then((report) => {
      if (!active) return;
      setSyntaxReport(report);
      setSyntaxState("done");
    });
    return () => { active = false; };
  }, [code]);

  useEffect(() => {
    if ((explanation || isLoading) && codePreRef.current) {
      const naturalHeight = codePreRef.current.scrollHeight;
      if (naturalHeight < 150) {
        setCalculatedHeight(`${naturalHeight * 2}px`);
      } else {
        setCalculatedHeight(`${naturalHeight}px`);
      }
    }
  }, [explanation, isLoading, code]);

  let highlightedCode = code;
  try {
    highlightedCode = hljs.getLanguage(lang) 
      ? hljs.highlight(code, { language: lang }).value 
      : hljs.highlightAuto(code).value;
  } catch (e) {}

  const parseInlineMarkdown = (text: string, lineIdx: number): React.ReactNode => {
    if (!text || typeof text !== "string") return "";

    const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let tokenIdx = 0;

    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        const plainText = text.substring(lastIndex, matchIndex);
        elements.push(
          <span key={`ln-${lineIdx}-txt-${tokenIdx++}`}>{plainText}</span>
        );
      }

      const [
        _,
        boldFull, boldText,
        italicStarFull, italicStarText,
        italicUnderFull, italicUnderText,
        codeFull, codeText
      ] = match;

      if (boldFull) {
        elements.push(
          <strong key={`ln-${lineIdx}-bold-${tokenIdx++}`} className="font-extrabold text-ink">
            {boldText}
          </strong>
        );
      } else if (italicStarFull || italicUnderFull) {
        const itText = italicStarText || italicUnderText;
        elements.push(
          <em key={`ln-${lineIdx}-italic-${tokenIdx++}`} className="italic text-muted">
            {itText}
          </em>
        );
      } else if (codeFull) {
        elements.push(
          <code key={`ln-${lineIdx}-code-${tokenIdx++}`} className="text-accent font-mono text-xs px-1.5 py-0.5 rounded bg-surface2 border border-edge">
            {codeText}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      elements.push(
        <span key={`ln-${lineIdx}-txt-end-${tokenIdx++}`}>{remainingText}</span>
      );
    }

    return elements.length > 0 ? (
      <Fragment key={`ln-${lineIdx}-parsed-root`}>{elements}</Fragment>
    ) : (
      text
    );
  };

  const renderFormattedExplanation = (text: string | null) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    let isInCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLineStart = 0;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const trimmed = line.trim();

      if (trimmed.startsWith("```") || trimmed.startsWith("'''")) {
        if (isInCodeBlock) {
          const codeString = codeBlockContent.join("\n");
          elements.push(
            <pre key={`nested-code-${codeBlockLineStart}`} className="p-3 my-2.5 rounded-md bg-code border border-edge overflow-x-auto text-left">
              <code className="text-xs font-mono text-code-ink whitespace-pre-wrap break-words">
                {codeString}
              </code>
            </pre>
          );
          isInCodeBlock = false;
          codeBlockContent = [];
        } else {
          isInCodeBlock = true;
          codeBlockLineStart = idx;
        }
        continue;
      }

      if (isInCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      if (trimmed === "---") {
        elements.push(<hr key={`hr-${idx}`} className="border-edge my-4" />);
        continue;
      }

      if (trimmed.startsWith("> ")) {
        elements.push(
          <blockquote key={`quote-${idx}`} className="border-l-4 border-accent/60 pl-4 py-1.5 my-2 italic text-muted bg-accent-soft rounded-r text-[13px] leading-relaxed">
            {parseInlineMarkdown(trimmed.slice(2), idx)}
          </blockquote>
        );
        continue;
      }

      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={`block-${idx}`} className="text-base font-bold text-ink mt-4 mb-2">
            {parseInlineMarkdown(trimmed.slice(4), idx)}
          </h4>
        );
        continue;
      }

      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3 key={`block-${idx}`} className="text-lg font-extrabold text-ink mt-5 mb-2 border-b border-edge pb-1">
            {parseInlineMarkdown(trimmed.slice(3), idx)}
          </h3>
        );
        continue;
      }

      if (trimmed.startsWith("# ")) {
        elements.push(
          <h2 key={`block-${idx}`} className="text-xl font-black text-ink mt-6 mb-3 border-b border-edge pb-1">
            {parseInlineMarkdown(trimmed.slice(2), idx)}
          </h2>
        );
        continue;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <ul key={`block-${idx}`} className="list-disc pl-5 text-muted my-1">
            <li key={`li-${idx}`}>{parseInlineMarkdown(trimmed.slice(2), idx)}</li>
          </ul>
        );
        continue;
      }

      const matchOrder = trimmed.match(/^(\d+)\.\s(.*)/);
      if (matchOrder) {
        const [, numberText, content] = matchOrder;
        elements.push(
          <ol key={`block-${idx}`} className="list-decimal pl-5 text-muted my-1" start={parseInt(numberText, 10)}>
            <li key={`li-${idx}`}>{parseInlineMarkdown(content, idx)}</li>
          </ol>
        );
        continue;
      }

      if (trimmed === "") {
        elements.push(<div key={`block-${idx}`} className="h-2" />);
        continue;
      }

      elements.push(
        <p key={`block-${idx}`} className="text-muted leading-relaxed text-[13px] my-1">
          {parseInlineMarkdown(line, idx)}
        </p>
      );
    }

    return <div className="space-y-1 mt-2 pb-4">{elements}</div>;
  };

  const isShowingExplanation = explanation || isLoading;
  const hasSyntaxErrors = syntaxReport !== null && !syntaxReport.toLowerCase().includes("no syntax errors");

  return (
    <div className={`relative w-full max-w-full overflow-visible ${isReceiver ? "my-6" : "my-3"}`}>
      <div className={`grid gap-4 transition-all duration-500 w-full max-w-full overflow-visible min-h-0 ${isShowingExplanation ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="relative group/code w-full max-w-full overflow-visible min-h-0">
          <div className="absolute top-0 left-0 flex z-20 border-b border-r border-edge rounded-br-lg overflow-visible bg-code">
            <ExplainDropdown onSelect={handleExplain} isLoading={isLoading} />
          </div>

          <div className="absolute top-0 right-0 flex z-20 border-b border-l border-edge rounded-bl-lg overflow-visible bg-code">
            {syntaxState === "checking" && (
              <span title="Checking syntax…" className="bg-code text-[10px] px-3 py-1.5 text-amber-400 font-bold uppercase select-none animate-pulse">●</span>
            )}
            {syntaxState === "done" && hasSyntaxErrors && (
              <button
                type="button"
                onClick={() => setSyntaxOpen(!syntaxOpen)}
                title={syntaxOpen ? "Hide issues" : "Show syntax issues & fixes"}
                className="bg-amber-500 hover:bg-amber-400 text-black text-[10px] px-3 py-1.5 font-bold uppercase transition-colors border-r border-black/20 cursor-pointer"
              >
                ⚠ {syntaxOpen ? "Hide" : "Issues"}
              </button>
            )}
            {syntaxState === "done" && !hasSyntaxErrors && (
              <span title="No syntax errors" className="bg-code text-[10px] px-3 py-1.5 text-ok font-bold uppercase select-none">✓</span>
            )}
            <button 
              onClick={() => onOpenCompiler(code, lang)} 
              className="bg-accent hover:bg-accent-hover text-[10px] px-3 py-1.5 text-white font-bold uppercase transition-colors border-r border-black/20 cursor-pointer"
            >
              Run
            </button>
            <button 
              onClick={() => onCopyCode(code)} 
              className="bg-surface2 hover:bg-edge text-[10px] px-3 py-1.5 text-ink font-bold uppercase transition-colors cursor-pointer"
            >
              Copy
            </button>
            {lang && (
              <div className="bg-code text-[10px] px-3 py-1.5 text-faint font-bold uppercase select-none rounded-tr-lg border-l border-edge">
                {lang}
              </div>
            )}
          </div>

          <pre 
            ref={codePreRef}
            style={isShowingExplanation ? { height: calculatedHeight } : undefined}
            className={`p-4 pt-10 rounded-lg overflow-x-auto overflow-y-auto bg-code text-code-ink border border-edge m-0 text-left transition-all duration-300 w-full max-w-full ${
              isShowingExplanation ? "" : "max-h-[350px]"
            } ${isReceiver ? "p-5" : ""}`}
          >
            <code 
              className={`text-xs font-mono hljs language-${lang} whitespace-pre-wrap break-words block`} 
              dangerouslySetInnerHTML={{ __html: highlightedCode }} 
            />
          </pre>

          {syntaxOpen && syntaxReport && (
            <div className="relative mt-2 p-3 pl-4 rounded-lg border border-amber-500/40 bg-surface text-left overflow-y-auto max-h-[260px]">
              <div className="absolute top-0 left-0 bg-amber-500 text-black text-[10px] px-3 py-1 font-bold uppercase rounded-br-lg select-none">
                Syntax Check
              </div>
              <div className="pt-5 text-[12px]">{renderFormattedExplanation(syntaxReport)}</div>
            </div>
          )}
        </div>

        {isShowingExplanation && (
          <div 
            style={{ height: calculatedHeight }}
            className="relative p-5 pt-12 rounded-lg border border-accent/30 bg-surface overflow-y-auto min-h-0 transition-all duration-300 text-left w-full max-w-full"
          >
            <div className="absolute top-0 left-0 bg-accent text-[10px] px-3 py-1.5 text-white font-bold uppercase rounded-br-lg select-none">
              {activeMode} MODE
            </div>

            <button 
              onClick={() => {
                setExplanation(null);
                setActiveMode(null);
              }} 
              className="absolute top-2.5 right-3 text-muted hover:text-accent transition-colors cursor-pointer text-sm"
              aria-label="Close"
            >
              ✕
            </button>

            {isLoading ? (
              <div className="flex items-center gap-2 text-ok font-mono text-sm mt-4 animate-pulse">
                <span>Generating explanation...</span>
              </div>
            ) : (
              renderFormattedExplanation(explanation)
            )}
          </div>
        )}
      </div>
    </div>
  );
}