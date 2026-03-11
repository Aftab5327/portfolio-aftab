"use client";

import { FormEvent, useMemo, useState } from "react";

const GEMINI_API_KEY = "AIzaSyC1D6CC-blnreIqoDxUGrp_kGI8ENQDFQ8";

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
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${SYSTEM_CONTEXT}

Recruiter question: ${trimmedMessage}`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();
      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        "I couldn't generate a reply right now. Please try again in a moment.";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: reply
        }
      ]);
    } catch {
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
    <section className="rounded-3xl glass px-6 py-[60px] sm:px-8 sm:py-[60px] lg:px-16 lg:py-20">
      <div className="reveal-up">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">AI Chat</p>
        <h1 className="fluid-subhead mt-3 font-semibold text-slate-900 dark:text-white">Ask My AI Assistant</h1>
        <p className="fluid-body mt-3 text-slate-700 dark:text-slate-200">
          A recruiter-friendly assistant trained on Aftab&apos;s web, IoT, and AI experience.
        </p>
      </div>

      <div className="reveal-up mt-8 rounded-2xl border border-white/10 bg-[#131313] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] sm:p-6">
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4">
          {hasMessages ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto bg-emerald-500/15 text-emerald-100"
                    : "border border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  {message.role === "user" ? "You" : "AI Assistant"}
                </p>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))
          ) : null}

          {isLoading ? (
            <div className="max-w-[92%] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Thinking...
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
              className="min-h-11 flex-1 rounded-xl border border-[#222220] bg-[#131313] px-4 py-3 text-sm text-[#f0ede8] outline-none transition-colors placeholder:text-[#7a7870] focus:border-[#4ade80]"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#4ade80] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Send
            </button>
          </div>
          {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
