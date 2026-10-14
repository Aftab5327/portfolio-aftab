"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

const QUICK_PROMPTS = ["Top Skills", "IoT Projects", "Availability", "Why Hire?"];
const MAX_MESSAGE_LENGTH = 500;

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export default function AIChatSection({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      text: `Ask about ${firstName}'s skills, IoT work, project experience, or job availability.`
    }
  ]);
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    // Skip the initial welcome message so the page doesn't jump on load.
    if (!hasInteracted.current) return;
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) return;
    hasInteracted.current = true;

    const userEntry: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmedMessage
    };

    setMessages((prev) => [...prev, userEntry]);
    setUserMessage("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Unable to reach the AI assistant right now. Please try again.");
      }

      const reply = data?.reply ?? "I couldn't generate a reply right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: reply
        }
      ]);
    } catch (caughtError) {
      // API errors are already generic and safe to display (see pages/api/chat.ts).
      setError(
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : "Unable to reach the AI assistant right now. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage(userMessage);
  };

  return (
    <section className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16">
      <div>
        <p className="font-mono text-sm text-teal">{"// ai-chat"}</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Ask My AI Assistant</h2>
        <p className="mt-3 text-[15px] text-txtdim">
          A recruiter-friendly assistant trained on {firstName}&apos;s web, IoT, and AI experience.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-panel2">
        <div className="flex items-center gap-2 border-b border-line bg-panel px-4 py-2.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-xs text-txtfaint">assistant.sh</span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-xs text-txtdim transition-colors hover:border-teal hover:text-teal"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-line bg-bg2 p-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto border border-teal/30 bg-teal/10 text-txt"
                    : "border border-line bg-panel text-txtdim"
                }`}
              >
                <p className="mb-1 font-mono text-[11px] text-teal">
                  {message.role === "user" ? "> you" : "$ assistant"}
                </p>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}

            {isLoading ? (
              <div className="max-w-[92%] rounded-xl border border-line bg-panel px-4 py-3 font-mono text-sm text-txtdim">
                Thinking<span className="animate-blink">_</span>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={userMessage}
                onChange={(event) => setUserMessage(event.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
                aria-label="Ask the AI assistant a question"
                placeholder={`Ask about ${firstName}'s skills, projects, or availability...`}
                className="min-h-12 flex-1 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-txt outline-none transition-colors placeholder:text-txtfaint focus:border-teal focus:ring-2 focus:ring-teal/40"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-teal px-6 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Send
              </button>
            </div>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
