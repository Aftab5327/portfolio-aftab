"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiArrowRight, FiCheckCircle, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { CONTACT_LIMITS, HONEYPOT_FIELD, validateContactFields, type ContactFieldErrors } from "@/lib/contact/shared";
import type { Profile } from "@/lib/schema";

export type ContactProfile = Pick<Profile, "email" | "phone" | "location" | "socials">;

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type FormValues = { name: string; email: string; subject: string; message: string };
const initialValues: FormValues = { name: "", email: "", subject: "", message: "" };

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function ContactSection({ profile }: { profile: ContactProfile }) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formToken, setFormToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | undefined>(undefined);

  const loadToken = useCallback(async () => {
    try {
      const response = await fetch("/api/contact/token", { cache: "no-store" });
      const data = (await response.json()) as { token?: string };
      setFormToken(data.token ?? "");
    } catch {
      setFormToken("");
    }
  }, []);

  // The token's timestamp starts the "minimum time on form" clock.
  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  const renderTurnstile = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !window.turnstile || !turnstileRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "auto",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken("")
    });
  }, []);

  useEffect(() => {
    renderTurnstile();
  }, [renderTurnstile]);

  const update = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const fieldErrors = validateContactFields(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      const first = Object.keys(fieldErrors)[0];
      document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatus({ type: "error", message: "Please complete the verification below." });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          ...(values.subject.trim() ? { subject: values.subject } : {}),
          message: values.message,
          [HONEYPOT_FIELD]: honeypot,
          token: formToken,
          ...(turnstileToken ? { turnstileToken } : {})
        })
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string; fieldErrors?: ContactFieldErrors };

      if (response.ok && data.ok) {
        setValues(initialValues);
        setErrors({});
        setStatus({ type: "success", message: "Thanks! Your message is on its way. A confirmation email should arrive shortly." });
        void loadToken();
      } else {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setStatus({ type: "error", message: data.error || `Something went wrong. Please email ${profile.email} directly.` });
        // A rejected token (too fast / expired) needs a fresh one for the next attempt.
        if (response.status === 400 && !data.fieldErrors) void loadToken();
      }
    } catch {
      setStatus({ type: "error", message: `Couldn't reach the server. Please email ${profile.email} directly.` });
    } finally {
      setSubmitting(false);
      if (TURNSTILE_SITE_KEY) {
        window.turnstile?.reset(widgetId.current);
        setTurnstileToken("");
      }
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="rounded-card border border-line bg-panel px-6 py-12 shadow-soft sm:px-10 lg:px-14 lg:py-16"
    >
      {TURNSTILE_SITE_KEY ? (
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onLoad={renderTurnstile} />
      ) : null}

      <p className="font-mono text-sm text-teal">{"// contact"}</p>
      <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">Let&apos;s Start a Conversation</h2>
      <p className="mt-3 text-[15px] text-txtdim">Bring your ideas to life</p>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
          {status?.type === "success" ? (
            <div role="status" aria-live="polite" className="flex flex-col items-start gap-4 py-6">
              <FiCheckCircle aria-hidden className="h-8 w-8 text-teal" />
              <p className="text-[15px] leading-relaxed text-txt">{status.message}</p>
              <button
                type="button"
                onClick={() => setStatus(null)}
                className="font-mono text-sm text-teal underline-offset-2 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-describedby="contact-status">
              <Field label="name" id="contact-name" autoComplete="name" value={values.name} error={errors.name} maxLength={CONTACT_LIMITS.name.max} placeholder="Your name" onChange={update("name")} required />
              <Field label="email" id="contact-email" type="email" autoComplete="email" value={values.email} error={errors.email} maxLength={CONTACT_LIMITS.email.max} placeholder="you@example.com" onChange={update("email")} required />
              <Field label="subject (optional)" id="contact-subject" value={values.subject} error={errors.subject} maxLength={CONTACT_LIMITS.subject.max} placeholder="What's it about?" onChange={update("subject")} />

              <div>
                <label htmlFor="contact-message" className="mb-1.5 block font-mono text-xs text-txtdim">
                  <span aria-hidden="true">{"// "}</span>
                  message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  required
                  value={values.message}
                  maxLength={CONTACT_LIMITS.message.max}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? "contact-message-error" : "contact-message-count"}
                  onChange={(event) => update("message")(event.target.value)}
                  className={`w-full rounded-xl border bg-panel2 px-4 py-3 text-sm text-txt outline-none transition-colors placeholder:text-txtfaint focus:ring-2 focus:ring-teal/40 ${
                    errors.message ? "border-danger" : "border-line focus:border-teal"
                  }`}
                  placeholder="Write your message..."
                />
                {errors.message ? (
                  <p id="contact-message-error" className="mt-1 text-xs text-danger">
                    {errors.message}
                  </p>
                ) : (
                  <p id="contact-message-count" className="mt-1 text-right font-mono text-[11px] text-txtdim">
                    {values.message.length}/{CONTACT_LIMITS.message.max}
                  </p>
                )}
              </div>

              {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
              <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor={`contact-${HONEYPOT_FIELD}`}>Leave this field empty</label>
                <input
                  id={`contact-${HONEYPOT_FIELD}`}
                  name={HONEYPOT_FIELD}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              {TURNSTILE_SITE_KEY ? <div ref={turnstileRef} className="min-h-[65px]" /> : null}

              <p id="contact-status" role="status" aria-live="polite" className={`min-h-[1.25rem] text-sm ${status?.type === "error" ? "text-danger" : "text-txtdim"}`}>
                {status?.type === "error" ? status.message : ""}
              </p>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <>
                    <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <FiArrowRight aria-hidden />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold text-txt">Ready to collaborate?</h3>
            <p className="mt-2 text-[15px] text-txtdim">Here&apos;s how you can reach me</p>
          </div>

          <ContactCard icon={<FiMail />} label="email" value={profile.email} />
          {profile.phone ? <ContactCard icon={<FiPhone />} label="mobile" value={profile.phone} /> : null}
          <ContactCard icon={<FiMapPin />} label="location" value={profile.location} />

          <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
            <p className="font-mono text-xs text-txtdim">{"// connect"}</p>
            <div className="mt-3 flex items-center gap-2">
              <SocialIcon href={profile.socials.github} ariaLabel="GitHub" icon={<FaGithub />} />
              <SocialIcon href={profile.socials.linkedin} ariaLabel="LinkedIn" icon={<FaLinkedinIn />} />
              {profile.socials.twitter ? <SocialIcon href={profile.socials.twitter} ariaLabel="X (Twitter)" icon={<FaXTwitter />} /> : null}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

type FieldProps = {
  label: string;
  id: string;
  value: string;
  error?: string;
  type?: string;
  autoComplete?: string;
  placeholder: string;
  maxLength: number;
  required?: boolean;
  onChange: (value: string) => void;
};

function Field({ label, id, value, error, type = "text", autoComplete, placeholder, maxLength, required, onChange }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block font-mono text-xs text-txtdim">
        <span aria-hidden="true">{"// "}</span>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-panel2 px-4 py-3 text-sm text-txt outline-none transition-colors placeholder:text-txtfaint focus:ring-2 focus:ring-teal/40 ${
          error ? "border-danger" : "border-line focus:border-teal"
        }`}
        placeholder={placeholder}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ContactCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal/30 bg-teal/10 text-teal">{icon}</div>
        <div>
          <p className="font-mono text-xs text-txtdim">
            <span aria-hidden="true">{"// "}</span>
            {label}
          </p>
          <p className="mt-1 text-base font-medium text-txt">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SocialIcon({ href, ariaLabel, icon }: { href: string; ariaLabel: string; icon: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={ariaLabel}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 text-teal transition hover:-translate-y-0.5 hover:bg-teal/20"
    >
      {icon}
    </a>
  );
}
