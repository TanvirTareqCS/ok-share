export type ExplainMode = "SYNTAX" | "ADIB" | "FABIHA" | "MAHATAB" | "MAHIN";

export interface GroupMessage {
  id: string;
  sender: string;
  text?: string;
  timestamp: number;
  sealed?: boolean;
  ciphertext?: string;
  iv?: string;
}

export interface SharedSecret {
  text?: string;
  sealed?: boolean;
  ciphertext?: string;
  salt?: string;
  iv?: string;
  views?: number;
  maxViews?: number;
  createdAt?: number;
}

export interface GroupMeta {
  creator: string;
  members: string[];
  createdAt: number;
  sealed?: boolean;
  salt?: string;
  typing?: Record<string, number>;
  lastRead?: Record<string, number>;
}

export type CompilerLanguageId =
  | "python-3.14"
  | "typescript-deno"
  | "g++-15"
  | "dotnet-csharp-9"
  | "ruby-4.0"
  | "openjdk-25";

export interface CompileResult {
  status?: string;
  output?: string;
  error?: string;
}
