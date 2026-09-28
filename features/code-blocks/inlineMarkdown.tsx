import { Fragment } from "react";
import type { ReactNode } from "react";

export function parseInlineMarkdown(text: string, lineIndex: number): ReactNode {
  if (!text || typeof text !== "string") return "";

  const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)/g;

  const elements: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(
        <span key={`ln-${lineIndex}-txt-${tokenIndex++}`}>{text.substring(lastIndex, match.index)}</span>,
      );
    }

    const [
      ,
      boldFull,
      boldText,
      italicStarFull,
      italicStarText,
      italicUnderFull,
      italicUnderText,
      codeFull,
      codeText,
    ] = match;

    if (boldFull) {
      elements.push(
        <strong key={`ln-${lineIndex}-bold-${tokenIndex++}`} className="font-extrabold text-ink">
          {boldText}
        </strong>,
      );
    } else if (italicStarFull || italicUnderFull) {
      elements.push(
        <em key={`ln-${lineIndex}-italic-${tokenIndex++}`} className="italic text-muted">
          {italicStarText || italicUnderText}
        </em>,
      );
    } else if (codeFull) {
      elements.push(
        <code
          key={`ln-${lineIndex}-code-${tokenIndex++}`}
          className="text-accent font-mono text-xs px-1.5 py-0.5 rounded bg-surface2 border border-edge"
        >
          {codeText}
        </code>,
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(
      <span key={`ln-${lineIndex}-txt-end-${tokenIndex++}`}>{text.substring(lastIndex)}</span>,
    );
  }

  return elements.length > 0 ? (
    <Fragment key={`ln-${lineIndex}-parsed-root`}>{elements}</Fragment>
  ) : (
    text
  );
}
