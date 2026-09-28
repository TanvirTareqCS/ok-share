export type ContentSegment =
  | { kind: "text"; value: string }
  | { kind: "code"; language: string; code: string };

const FENCE = "'''";

export function parseCodeFences(content: string): ContentSegment[] {
  const parts = content.split(FENCE);
  const segments: ContentSegment[] = [];

  for (let index = 0; index < parts.length; index++) {
    if (index % 4 === 0) {
      if (parts[index]) segments.push({ kind: "text", value: parts[index] });
      continue;
    }

    if (index % 4 !== 1) continue;

    if (index + 2 < parts.length) {
      segments.push({
        kind: "code",
        language: parts[index].trim(),
        code: parts[index + 1].trim(),
      });
      index += 2;
    } else {
      segments.push({ kind: "text", value: `${FENCE}${parts[index]}` });
    }
  }

  return segments;
}
