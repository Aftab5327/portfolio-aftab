"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiArrowUpRight, FiRotateCcw, FiSend, FiSquare, FiTrash2 } from "react-icons/fi";
import type MarkdownComponent from "@/components/Markdown";
import type { ChatAction } from "@/lib/chat-tools";

/** react-markdown is only needed once someone chats, so it's loaded on demand (keeps ~50 kB off the home page). */
const loadMarkdown = () => import("@/components/Markdown").then((module) => module.default);

const MAX_MESSAGE_LENGTH = 500;
const MAX_TURNS = 6;
const MAX_TOTAL_CHARS = 3_000;
const GENERIC_ERROR = "Unable to reach the AI assistant right now. Please try again.";

type Citation = { n: number; title: string; url: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "done" | "stopped" | "error";
  citations?: Citation[];
  actions?: ChatAction[];
  error?: string;
};

type Props = {
  firstName: string;
  /** Suggested questions for the empty state, generated from the portfolio data. */
  suggestions: string[];
  docsHref: string;
};

/** "[2]" citation markers are shown as the Sources list instead of inline. */
const stripCitations = (text: string) => text.replace(/\s?\[(?:source\s*)?\d{1,2}\](?!\()/gi, "");

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** Parses a text/event-stream body into { event, data } objects. */
async function* readEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) >= 0) {
        const raw = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        let event = "message";
        let data = "";
        for (const line of raw.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (data) yield { event, data: JSON.parse(data) as Record<string, unknown> };
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** The last ≤ 6 turns, each ≤ 500 chars and ≤ 3000 chars in total, as the API requires. */
function historyFor(messages: Message[]): { role: Message["role"]; content: string }[] {
  const turns = messages
    .filter((message) => message.content.trim() && message.status !== "error")
    .map((message) => ({ role: message.role, content: stripCitations(message.content).slice(0, MAX_MESSAGE_LENGTH) }))
    .slice(-MAX_TURNS);
  while (turns.reduce((sum, turn) => sum + turn.content.length, 0) > MAX_TOTAL_CHARS || turns[0]?.role === "assistant") turns.shift();
  return turns;
}

function ActionChip({ action }: { action: ChatAction }) {
  const className =
    "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs text-teal transition-colors";
  if (!action.external) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  const isMail = action.href.startsWith("mailto:");
  return (
    <a href={action.href} className={className} {...(isMail ? {} : { target: "_blank", rel: "noreferrer" })}>
      {action.label}
      {isMail ? null : <FiArrowUpRight aria-hidden />}
    </a>
  );
}

export default function AIChatSection({ firstName, suggestions, docsHref }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [Markdown, setMarkdown] = useState<typeof MarkdownComponent | null>(null);

  const preloadMarkdown = useCallback(() => {
    if (!Markdown) void loadMarkdown().then((component) => setMarkdown(() => component));
  }, [Markdown]);

  useEffect(() => {
    if (messages.length) preloadMarkdown();
  }, [messages.length, preloadMarkdown]);

  useEffect(() => {
    if (!messages.length) return;
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Stop any in-flight answer when the section unmounts.
  useEffect(() => () => abortRef.current?.abort(), []);

  const update = useCallback(
    (id: string, patch: (message: Message) => Partial<Message>) =>
      setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, ...patch(message) } : message))),
    []
  );

  const ask = useCallback(
    async (question: string, base: Message[]) => {
      const text = question.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!text) return;

      const user: Message = { id: newId("user"), role: "user", content: text };
      const answer: Message = { id: newId("assistant"), role: "assistant", content: "", status: "streaming" };
      const payload = historyFor([...base, user]);
      setMessages([...base, user, answer]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: payload }),
          signal: controller.signal
        });

        if (!response.ok || !response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          update(answer.id, () => ({ status: "error", error: data.error || GENERIC_ERROR }));
          return;
        }

        for await (const { event, data } of readEvents(response.body)) {
          if (event === "token" && typeof data.text === "string") {
            const chunk = data.text;
            update(answer.id, (message) => ({ content: message.content + chunk }));
          } else if (event === "done") {
            update(answer.id, () => ({
              status: "done",
              citations: (data.citations as Citation[]) ?? [],
              actions: (data.actions as ChatAction[]) ?? []
            }));
          } else if (event === "error") {
            update(answer.id, () => ({ status: "error", error: typeof data.error === "string" ? data.error : GENERIC_ERROR }));
          }
        }
        // Stream ended without a "done" event (e.g. connection dropped).
        update(answer.id, (message) => (message.status === "streaming" ? { status: "error", error: GENERIC_ERROR } : {}));
      } catch (error) {
        const aborted = error instanceof DOMException && error.name === "AbortError";
        update(answer.id, () => (aborted ? { status: "stopped" } : { status: "error", error: GENERIC_ERROR }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
        inputRef.current?.focus();
      }
    },
    [update]
  );

  const send = (question: string) => {
    if (streaming) return;
    void ask(question, messages);
  };

  const stop = () => abortRef.current?.abort();

  const retry = (failedId: string) => {
    if (streaming) return;
    const index = messages.findIndex((message) => message.id === failedId);
    const question = messages[index - 1];
    if (question?.role !== "user") return;
    void ask(question.content, messages.slice(0, index - 1));
  };

  const clear = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && streaming) {
      event.preventDefault();
      stop();
    }
  };

  return (
    <section className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
      <div>
        <p className="font-mono text-sm text-teal">{"// ai-chat"}</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Ask My AI Assistant</h2>
        <p className="mt-3 text-[15px] text-txtdim">
          Answers come only from this portfolio&apos;s content about {firstName}, with sources.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-panel2">
        <div className="flex items-center gap-2 border-b border-line bg-panel px-4 py-2.5">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span aria-hidden className="ml-2 font-mono text-xs text-txtfaint">
            assistant.sh
          </span>
          {messages.length ? (
            <button
              type="button"
              onClick={clear}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-txtdim transition-colors hover:text-teal"
            >
              <FiTrash2 aria-hidden />
              Clear chat
            </button>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-busy={streaming}
            aria-label="Chat messages"
            className="max-h-[480px] min-h-[220px] space-y-3 overflow-y-auto rounded-xl border border-line bg-bg2 p-4"
          >
            {messages.length === 0 ? (
              <div className="py-2">
                <p className="text-sm text-txtdim">
                  <span className="font-mono text-[11px] text-teal">$ assistant</span>
                  <br />
                  Ask about {firstName}&apos;s projects, skills, experience or availability. Try one of these:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="rounded-md border border-line bg-panel px-3 py-1.5 text-left font-mono text-xs text-txtdim transition-colors hover:border-teal hover:text-teal"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="ml-auto max-w-[92%] rounded-xl border px-4 py-3 text-sm text-txt">
                  <p className="mb-1 font-mono text-[11px] text-teal">{"> you"}</p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ) : (
                <div key={message.id} className="max-w-[92%] rounded-xl border border-line bg-panel px-4 py-3 text-sm text-txtdim">
                  <p className="mb-1 font-mono text-[11px] text-teal">$ assistant</p>

                  {message.content ? (
                    <div className="[&_p]:text-sm [&_ul]:text-sm">
                      {Markdown ? (
                        <Markdown>{stripCitations(message.content)}</Markdown>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{stripCitations(message.content)}</p>
                      )}
                    </div>
                  ) : message.status === "streaming" ? (
                    <p className="font-mono text-sm">Thinking</p>
                  ) : null}
                  {message.status === "streaming" ? (
                    <span aria-hidden className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-teal align-middle" />
                  ) : null}

                  {message.status === "stopped" ? <p className="mt-2 font-mono text-[11px] text-txtdim">— stopped</p> : null}

                  {message.status === "error" ? (
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <p role="alert" className="text-sm text-danger">
                        {message.error}
                      </p>
                      <button
                        type="button"
                        onClick={() => retry(message.id)}
                        disabled={streaming}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 font-mono text-xs text-txt transition-colors hover:border-teal hover:text-teal disabled:opacity-50"
                      >
                        <FiRotateCcw aria-hidden />
                        Retry
                      </button>
                    </div>
                  ) : null}

                  {message.actions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.actions.map((action) => (
                        <ActionChip key={action.href} action={action} />
                      ))}
                    </div>
                  ) : null}

                  {message.citations?.length ? (
                    <p className="mt-3 border-t border-line pt-2 font-mono text-[11px] text-txtdim">
                      Sources:{" "}
                      {message.citations.map((citation, index) => (
                        <span key={citation.url}>
                          {index > 0 ? " · " : ""}
                          <Link href={citation.url} className="text-teal underline-offset-2 hover:underline">
                            {citation.title}
                          </Link>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </div>
              )
            )}
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                onFocus={preloadMarkdown}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label={`Ask the AI assistant about ${firstName}`}
                placeholder={`Ask about ${firstName}'s skills, projects, or availability...`}
                className="min-h-12 flex-1 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-txt outline-hidden transition-colors placeholder:text-txtfaint focus:border-teal focus:ring-2"
              />
              {streaming ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal px-6 text-sm font-semibold text-teal transition"
                >
                  <FiSquare aria-hidden />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSend aria-hidden />
                  Send
                </button>
              )}
            </div>
            <p className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-txtdim">
              <span>
                {streaming ? "Press Esc to stop" : `${input.length}/${MAX_MESSAGE_LENGTH}`} · conversations aren&apos;t stored
              </span>
              <Link href={docsHref} className="text-teal underline-offset-2 hover:underline">
                How this assistant works →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
