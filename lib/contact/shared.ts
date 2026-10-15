/**
 * Contact-form limits shared by the client form and the API (no zod here, so the
 * client bundle stays small; the server validates with zod in lib/contact/schema.ts).
 */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  subject: { max: 120 },
  message: { min: 10, max: 2000 },
  email: { max: 254 }
} as const;

/** Minimum time between loading the form and submitting it. */
export const MIN_FORM_MS = 3_000;
/** A form token older than this is rejected (the visitor can just resubmit). */
export const MAX_FORM_AGE_MS = 2 * 60 * 60 * 1000;

/** Name of the hidden honeypot field. Humans never see or fill it. */
export const HONEYPOT_FIELD = "website";

export type ContactFieldErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Client-side mirror of the server rules, for instant inline errors. */
export function validateContactFields(values: { name: string; email: string; subject: string; message: string }): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = values.name.trim();
  const message = values.message.trim();
  if (name.length < CONTACT_LIMITS.name.min) errors.name = "Please enter your name (at least 2 characters).";
  else if (name.length > CONTACT_LIMITS.name.max) errors.name = `Name must be ${CONTACT_LIMITS.name.max} characters or fewer.`;
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (values.subject.trim().length > CONTACT_LIMITS.subject.max) errors.subject = `Subject must be ${CONTACT_LIMITS.subject.max} characters or fewer.`;
  if (message.length < CONTACT_LIMITS.message.min) errors.message = `Message must be at least ${CONTACT_LIMITS.message.min} characters.`;
  else if (message.length > CONTACT_LIMITS.message.max) errors.message = `Message must be ${CONTACT_LIMITS.message.max} characters or fewer.`;
  return errors;
}
