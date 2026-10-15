/** Escaping helpers: user input is never trusted in emails or Telegram messages. */

export const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Telegram MarkdownV2 requires escaping these characters everywhere in text. */
export const escapeTelegram = (value: string) => value.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (char) => `\\${char}`);

/** Single-line header values (subject, name): no CR/LF header injection, trimmed. */
export const oneLine = (value: string, max = 200) => value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
