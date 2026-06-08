"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";
import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FiArrowRight, FiMail, FiMapPin, FiPhone } from "react-icons/fi";

type FormValues = {
  fullName: string;
  email: string;
  subject: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  fullName: "",
  email: "",
  subject: "",
  message: ""
};

export default function ContactSection() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const emailPattern = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const validate = (form: FormValues) => {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    else if (!emailPattern.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (!form.subject.trim()) nextErrors.subject = "Subject is required.";
    if (!form.message.trim()) nextErrors.message = "Message is required.";

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await emailjs.send(
        "YOUR_SERVICE_ID",
        "YOUR_TEMPLATE_ID",
        {
          from_name: values.fullName,
          from_email: values.email,
          subject: values.subject,
          message: values.message,
          to_email: "dhalaitaftab2252001@gmail.com"
        },
        "YOUR_PUBLIC_KEY"
      );

      setStatus({ type: "success", message: "✅ Message sent successfully!" });
      setValues(initialValues);
      setErrors({});
    } catch {
      setStatus({ type: "error", message: "❌ Something went wrong. Try again." });
    } finally {
      setIsSubmitting(false);
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
      <p className="font-mono text-sm text-teal">// contact</p>
      <h2 className="fluid-heading mt-3 font-display font-bold tracking-tight text-txt">
        Let&apos;s Start a Conversation
      </h2>
      <p className="mt-3 text-[15px] text-txtdim">Bring your ideas to life</p>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
          {/* EmailJS Setup:
              1. Go to https://emailjs.com and create free account
              2. Add Email Service and connect Gmail
              3. Create Email Template with variables:
                 {{from_name}}, {{from_email}}, {{subject}}, {{message}}
              4. Replace:
                 YOUR_SERVICE_ID, YOUR_TEMPLATE_ID, YOUR_PUBLIC_KEY
          */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              label="full_name"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={values.fullName}
              error={errors.fullName}
              onChange={(value) => setValues((prev) => ({ ...prev, fullName: value }))}
            />
            <Field
              label="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={values.email}
              error={errors.email}
              onChange={(value) => setValues((prev) => ({ ...prev, email: value }))}
            />
            <Field
              label="subject"
              name="subject"
              type="text"
              placeholder="Subject"
              value={values.subject}
              error={errors.subject}
              onChange={(value) => setValues((prev) => ({ ...prev, subject: value }))}
            />

            <div>
              <label htmlFor="message" className="mb-1.5 block font-mono text-xs text-txtdim">
                // message
              </label>
              <textarea
                id="message"
                rows={5}
                value={values.message}
                onChange={(event) => setValues((prev) => ({ ...prev, message: event.target.value }))}
                className={`w-full rounded-xl border bg-panel2 px-4 py-3 text-sm text-txt outline-none transition-colors placeholder:text-txtfaint focus:ring-2 focus:ring-teal/40 ${
                  errors.message ? "border-red-500" : "border-line focus:border-teal"
                }`}
                placeholder="Write your message..."
              />
              {errors.message ? <p className="mt-1 text-xs text-red-400">{errors.message}</p> : null}
            </div>

            {status ? (
              <p className={`text-sm ${status.type === "success" ? "text-teal" : "text-red-400"}`}>{status.message}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal px-5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg/30 border-t-bg" />
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
            <h3 className="font-display text-xl font-bold text-txt">Ready to collaborate?</h3>
            <p className="mt-2 text-[15px] text-txtdim">Here&apos;s how you can reach me</p>
          </div>

          <ContactCard icon={<FiMail />} label="email" value="aftab.iot@gmail.com" />
          <ContactCard icon={<FiPhone />} label="mobile" value="+91 9370312566" />
          <ContactCard icon={<FiMapPin />} label="location" value="Pune, India" />

          <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
            <p className="font-mono text-xs text-txtdim">// connect</p>
            <div className="mt-3 flex items-center gap-2">
              <SocialIcon href="https://github.com/Aftab5327" ariaLabel="GitHub" icon={<FaGithub />} />
              <SocialIcon
                href="https://www.linkedin.com/in/aftab-dhalait-33821226a/"
                ariaLabel="LinkedIn"
                icon={<FaLinkedinIn />}
              />
              <SocialIcon href="https://twitter.com/yourusername" ariaLabel="Twitter" icon={<FaXTwitter />} />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
};

function Field({ label, name, type, placeholder, value, error, onChange }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block font-mono text-xs text-txtdim">
        // {label}
      </label>
      <input
        id={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-12 w-full rounded-xl border bg-panel2 px-4 py-3 text-sm text-txt outline-none transition-colors placeholder:text-txtfaint focus:ring-2 focus:ring-teal/40 ${
          error ? "border-red-500" : "border-line focus:border-teal"
        }`}
        placeholder={placeholder}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}

type ContactCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function ContactCard({ icon, label, value }: ContactCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-panel2 p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-teal/30 bg-teal/10 text-teal">
          {icon}
        </div>
        <div>
          <p className="font-mono text-xs text-txtdim">// {label}</p>
          <p className="mt-1 text-base font-medium text-txt">{value}</p>
        </div>
      </div>
    </div>
  );
}

type SocialIconProps = {
  href: string;
  ariaLabel: string;
  icon: ReactNode;
};

function SocialIcon({ href, ariaLabel, icon }: SocialIconProps) {
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
