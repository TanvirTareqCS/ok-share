import type { CompilerLanguageId } from "@/lib/types";

export interface CompilerLanguageOption {
  id: CompilerLanguageId;
  label: string;
  aliases: string[];
}

export const COMPILER_LANGUAGES: readonly CompilerLanguageOption[] = [
  { id: "python-3.14", label: "python", aliases: ["python"] },
  { id: "typescript-deno", label: "javascript", aliases: ["javascript", "node"] },
  { id: "g++-15", label: "c++", aliases: ["c++", "cpp"] },
  { id: "dotnet-csharp-9", label: "c#", aliases: ["c#"] },
  { id: "ruby-4.0", label: "ruby", aliases: ["ruby"] },
  { id: "openjdk-25", label: "java", aliases: ["java"] },
];

export function resolveCompilerLanguage(language: string): CompilerLanguageId | null {
  const normalized = language.toLowerCase();
  return (
    COMPILER_LANGUAGES.find((option) => option.aliases.includes(normalized))?.id ?? null
  );
}
