"use client";

import { FormEvent, useMemo, useState } from "react";

const QUICK_PROMPTS = ["Top Skills", "IoT Projects", "Availability", "Why Hire?"];

const SYSTEM_CONTEXT = `You are Aftab Dhalait's portfolio AI assistant.

About Aftab:
- Full Stack Developer, IoT Engineer, AI Builder
- Location: Pune, India
- Email: aftab.iot@gmail.com | Phone: +91 9370312566
- Education: B.E. Electronics & Telecommunication (Data Science Honors) + CDAC Advanced Computing
- Experience: 2+ years, 10+ projects built
- Open to: Full Stack, IoT, and AI job roles

Skills:
- Frontend: React.js, Next.js, JavaScript, TypeScript, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Express.js, Python, REST APIs
- Database: MongoDB, MySQL
- IoT: Arduino, ESP32, MQTT Protocol, Embedded C, Sensor Integration
- AI/ML: TensorFlow, CNN, OpenCV, LLM integration
- DevOps: Git, GitHub, Docker, Linux, Vercel, Postman

Projects:
1. Smart Cap for Visually Impaired - CNN + OpenCV + Arduino assistive tech
2. InfraSense 360 - IoT infrastructure monitoring (energy, water, carbon sensors)
3. LLM Monitoring System - tracks LLM performance with real-time analytics
4. Real-Time Cloud Weather Monitoring - IoT + MQTT + React live dashboard
5. E-Commerce Platform - full MERN stack with Redux and payment integration
6. FastBox Delivery Optimizer - Python algorithm for logistics simulation
7. Smart Bookmark App - Supabase + React SaaS cross-device app
8. Product Catalog - Next.js + MongoDB full-stack platform

Answer recruiter questions in a helpful, concise way (under 100 words).
Use bullet points when listing things.`;

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Ask about Aftab's skills, IoT work, project experience, or job availability."
  }
];

export default function AIChatSection() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isLoading) return;

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
      console.log("AI chat API response", {
        ok: response.ok,
        status: response.status,
        data
      });

      if (!response.ok) {
        throw new Error(data?.error || "Gemini request failed.");
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
      console.log("AI chat request failed", caughtError);
      setError("Unable to reach the AI assistant right now. Please try again.");
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
        <p className="font-mono text-sm text-teal">// ai-chat</p>
        <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Ask My AI Assistant</h2>
        <p className="mt-3 text-[15px] text-txtdim">
          A recruiter-friendly assistant trained on Aftab&apos;s web, IoT, and AI experience.
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

          <div className="mt-5 space-y-3 rounded-xl border border-line bg-bg2 p-4">
            {hasMessages
              ? messages.map((message) => (
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
                ))
              : null}

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
                placeholder="Ask about Aftab's skills, projects, or availability..."
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
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
