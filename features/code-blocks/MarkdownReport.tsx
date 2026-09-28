import type { ReactNode } from "react";
import { parseInlineMarkdown } from "./inlineMarkdown";

const CODE_FENCE = /^(```|''')/;
const HEADING = /^(#{1,3})\s/;
const ORDERED_ITEM = /^(\d+)\.\s(.*)/;

export default function MarkdownReport({ text }: { text: string | null }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: ReactNode[] = [];

  let isInCodeBlock = false;
  let codeBlockLines: string[] = [];
  let codeBlockStartLine = 0;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();

    if (CODE_FENCE.test(trimmed)) {
      if (isInCodeBlock) {
        elements.push(
          <pre
            key={`nested-code-${codeBlockStartLine}`}
            className="p-3 my-2.5 rounded-md bg-code border border-edge overflow-x-auto text-left"
          >
            <code className="text-xs font-mono text-code-ink whitespace-pre-wrap break-words">
              {codeBlockLines.join("\n")}
            </code>
          </pre>,
        );
        isInCodeBlock = false;
        codeBlockLines = [];
      } else {
        isInCodeBlock = true;
        codeBlockStartLine = index;
      }
      continue;
    }

    if (isInCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    if (trimmed === "---") {
      elements.push(<hr key={`hr-${index}`} className="border-edge my-4" />);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-4 border-accent/60 pl-4 py-1.5 my-2 italic text-muted bg-accent-soft rounded-r text-[13px] leading-relaxed"
        >
          {parseInlineMarkdown(trimmed.slice(2), index)}
        </blockquote>,
      );
      continue;
    }

    const heading = trimmed.match(HEADING);
    if (heading) {
      elements.push(
        <MarkdownHeading
          key={`block-${index}`}
          level={heading[1].length}
          text={trimmed.slice(heading[0].length)}
          lineIndex={index}
        />,
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <ul key={`block-${index}`} className="list-disc pl-5 text-muted my-1">
          <li key={`li-${index}`}>{parseInlineMarkdown(trimmed.slice(2), index)}</li>
        </ul>,
      );
      continue;
    }

    const orderedItem = trimmed.match(ORDERED_ITEM);
    if (orderedItem) {
      elements.push(
        <ol
          key={`block-${index}`}
          className="list-decimal pl-5 text-muted my-1"
          start={parseInt(orderedItem[1], 10)}
        >
          <li key={`li-${index}`}>{parseInlineMarkdown(orderedItem[2], index)}</li>
        </ol>,
      );
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={`block-${index}`} className="h-2" />);
      continue;
    }

    elements.push(
      <p key={`block-${index}`} className="text-muted leading-relaxed text-[13px] my-1">
        {parseInlineMarkdown(line, index)}
      </p>,
    );
  }

  return <div className="space-y-1 mt-2 pb-4">{elements}</div>;
}

const HEADING_STYLES: Record<number, string> = {
  1: "text-xl font-black text-ink mt-6 mb-3 border-b border-edge pb-1",
  2: "text-lg font-extrabold text-ink mt-5 mb-2 border-b border-edge pb-1",
  3: "text-base font-bold text-ink mt-4 mb-2",
};

function MarkdownHeading({
  level,
  text,
  lineIndex,
}: {
  level: number;
  text: string;
  lineIndex: number;
}) {
  const content = parseInlineMarkdown(text, lineIndex);

  if (level === 1) return <h2 className={HEADING_STYLES[1]}>{content}</h2>;
  if (level === 2) return <h3 className={HEADING_STYLES[2]}>{content}</h3>;
  return <h4 className={HEADING_STYLES[3]}>{content}</h4>;
}
