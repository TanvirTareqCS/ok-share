import type { ExplainMode } from "@/lib/types";

const EXPLAIN_PROMPTS: Record<ExplainMode, string> = {
  ADIB:
    "Explain this code in very simple Bengali script, as if teaching a beginner. Break down the logic step-by-step in native Bengali.",
  FABIHA:
    "Explain this code in extremely simple, easy-to-understand English without using heavy technical jargon.",
  MAHATAB: "Give a highly concise, 2-sentence summary of exactly what this code does. Be direct.",
  MAHIN:
    "Over-explain the absolute most basic concepts of this code in massive detail, treating the reader like they have never seen code before.",
  SYNTAX:
    "You are a strict code reviewer. Check the code ONLY for syntax errors. Respond with a short report: for each error write '- Line X: <what is wrong> -> fix: <exact suggested edit>'. If there are no syntax errors, reply exactly 'No syntax errors found — code looks valid.' Do not summarize what the code does or suggest style improvements.",
};

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const DEFAULT_MODE: ExplainMode = "FABIHA";

interface GroqResponse {
  error?: { message?: string };
  choices?: { message: { content: string } }[];
}

export async function POST(request: Request) {
  try {
    const { code, mode } = (await request.json()) as { code: string; mode: ExplainMode };
    const systemPrompt = EXPLAIN_PROMPTS[mode] ?? EXPLAIN_PROMPTS[DEFAULT_MODE];

    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the code:\n\n${code}` },
        ],
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as GroqResponse;

    if (data.error) throw new Error(data.error.message);

    return Response.json({ explanation: data.choices![0].message.content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
