/**
 * Groq helpers shared by the AI writing scripts (case-study drafts, build log):
 * a chat call with 429 back-off, output cleanup, and the "no invented numbers"
 * check that every generated text must pass.
 */
import { GROQ_MODEL } from "../../lib/config";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callGroq(messages: ChatMessage[], { maxTokens = 2000, temperature = 0.2 } = {}): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");

  for (let attempt = 0; ; attempt += 1) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, temperature, max_tokens: maxTokens, messages })
    });

    if (response.status === 429 && attempt < 2) {
      const wait = Math.min(Number(response.headers.get("retry-after")) || 20, 60);
      console.log(`    rate limited by Groq; waiting ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    if (!response.ok) throw new Error(`Groq API ${response.status}: ${(await response.text()).slice(0, 200)}`);

    const data = (await response.json()) as { choices?: { message?: { content?: unknown } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("Groq returned an empty response");
    return content;
  }
}

/** Removes a code fence wrapped around the whole document, if the model added one. */
export function cleanOutput(text: string): string {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/);
  return `${(wrapped ? wrapped[1] : trimmed).trim()}\n`;
}

/** Metric-like numbers: "40%", "3x", "10k", "500+", "120 ms", "1,000 users"... */
const METRIC_PATTERN =
  /\b(\d[\d,.]*)\s*(%|x\b|×|k\b|\+|ms\b|users?\b|customers?\b|clients?\b|downloads?\b|visitors?\b|requests?\b|hours?\b|minutes?\b|seconds?\b|days?\b|times\b)/gi;

/** Metric-like numbers in `text` that don't appear in `context` (i.e. were invented). */
export function inventedMetrics(text: string, context: string): string[] {
  const invented = [...text.matchAll(METRIC_PATTERN)].filter((match) => !context.includes(match[1])).map((match) => match[0].trim());
  return [...new Set(invented)];
}

/** Any number at all in `text` that doesn't appear in `context` (stricter, for commit summaries). */
export function inventedNumbers(text: string, context: string): string[] {
  const numbers = [...text.matchAll(/\d[\d,.]*/g)].map((match) => match[0].replace(/[.,]+$/, "")).filter(Boolean);
  return [...new Set(numbers.filter((number) => !context.includes(number)))];
}
