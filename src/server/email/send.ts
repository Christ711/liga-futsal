import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getEnv } from "@/server/env";

import type { EmailContent } from "./templates/password-reset";

let transporter: Transporter | undefined;

/** Transporte SMTP (ADR 006): Gmail en producción y Mailpit en local y CI (ADR 018). */
function getTransporter(): Transporter {
  if (!transporter) {
    const env = getEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      // 465 usa TLS desde el inicio; los demás puertos negocian STARTTLS si el servidor lo ofrece.
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Envía un correo. Cambiar de proveedor solo toca este módulo (ADR 006). */
export async function sendEmail(message: { to: string } & EmailContent): Promise<void> {
  await getTransporter().sendMail({
    from: getEnv().MAIL_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
