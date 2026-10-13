import { config as loadDotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

import { site } from "@/lib/site-data";

// Ensure .env is loaded for server functions (Vite may not inject non-VITE_ keys).
loadDotenv({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env"),
});

/** Inbox that receives website enquiry / booking alerts. */
export const ENQUIRY_NOTIFY_TO =
  process.env["ENQUIRY_NOTIFY_TO"]?.trim() || site.email || "kangpethias@gmail.com";

function env(name: string) {
  return process.env[name]?.trim() || "";
}

function smtpConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASS"));
}

function createTransport() {
  const host = env("SMTP_HOST");
  const port = Number(env("SMTP_PORT") || "587");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const secure = env("SMTP_SECURE") === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export type SendMailInput = {
  to?: string;
  subject: string;
  text: string;
  replyTo?: string;
};

async function sendViaSmtp(input: SendMailInput, to: string): Promise<boolean> {
  const from = env("SMTP_FROM") || `"AKILI LABS" <${env("SMTP_USER")}>`;

  const transport = createTransport();
  await transport.sendMail({
    from,
    to,
    replyTo: input.replyTo || undefined,
    subject: input.subject,
    text: input.text,
  });
  return true;
}

/**
 * Zero-config fallback (no SMTP keys / SMTP failure). First delivery may
 * require clicking FormSubmit's activation email sent to the inbox.
 */
async function sendViaFormSubmit(input: SendMailInput, to: string): Promise<boolean> {
  if (env("ENQUIRY_FORM_SUBMIT") === "0") return false;

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: env("PUBLIC_SITE_URL") || "https://akililabs.com",
      Referer: `${env("PUBLIC_SITE_URL") || "https://akililabs.com"}/contact`,
    },
    body: JSON.stringify({
      name: "AKILI LABS website",
      email: input.replyTo || env("SMTP_USER") || "noreply@akililabs.com",
      _subject: input.subject,
      _replyto: input.replyTo || undefined,
      // Plain body only — avoid FormSubmit's card/table layout (and its free-tier sponsor ads).
      _template: "box",
      _blacklist: "spammybot,spambot",
      message: input.text,
    }),
  });

  const detail = await response.text().catch(() => "");
  let parsed: { success?: string | boolean; message?: string } | null = null;
  try {
    parsed = detail ? (JSON.parse(detail) as { success?: string | boolean; message?: string }) : null;
  } catch {
    parsed = null;
  }

  const okFlag = parsed?.success;
  const succeeded = response.ok && (okFlag === true || okFlag === "true" || okFlag === undefined);

  if (!succeeded) {
    const reason = parsed?.message || detail || `HTTP ${response.status}`;
    // Activation email was sent to the inbox — treat as a soft failure with a clear log.
    if (/activat/i.test(reason)) {
      console.warn("[akili-mail] FormSubmit needs activation — check inbox/spam for", to, reason);
    }
    throw new Error(`FormSubmit: ${reason}`);
  }
  return true;
}

/**
 * Send a notification email. Prefers SMTP; falls back to FormSubmit if SMTP
 * is missing or fails (e.g. invalid Gmail password).
 */
export async function sendMail(input: SendMailInput): Promise<boolean> {
  const to = input.to?.trim() || ENQUIRY_NOTIFY_TO;

  if (smtpConfigured()) {
    try {
      await sendViaSmtp(input, to);
      console.info("[akili-mail] sent via SMTP", { to, subject: input.subject });
      return true;
    } catch (error) {
      console.error("[akili-mail] SMTP failed — trying FormSubmit fallback", error);
    }
  } else {
    console.warn("[akili-mail] SMTP not configured — using FormSubmit", { to });
  }

  try {
    await sendViaFormSubmit(input, to);
    console.info("[akili-mail] sent via FormSubmit", { to, subject: input.subject });
    return true;
  } catch (error) {
    console.error("[akili-mail] send failed", error);
    return false;
  }
}
