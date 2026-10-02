/** Lectura de los correos capturados por Mailpit (ADR 018), para tests de integración y E2E. */
const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

export type CapturedEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

type MailpitSummary = { ID: string };
type MailpitMessage = {
  From: { Address: string };
  To: { Address: string }[];
  Subject: string;
  Text: string;
  HTML: string;
};

async function searchMessages(to: string): Promise<MailpitSummary[]> {
  const response = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
  );
  if (!response.ok) throw new Error(`Mailpit respondió ${response.status} al buscar correos.`);
  return ((await response.json()) as { messages: MailpitSummary[] }).messages;
}

/** Cantidad de correos recibidos por una dirección. */
export async function countEmailsTo(to: string): Promise<number> {
  return (await searchMessages(to)).length;
}

/** Espera hasta que llegue un correo a la dirección y devuelve el más reciente. */
export async function waitForEmailTo(to: string, timeoutMs = 10_000): Promise<CapturedEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [latest] = await searchMessages(to);
    if (latest) {
      const response = await fetch(`${MAILPIT_URL}/api/v1/message/${latest.ID}`);
      const message = (await response.json()) as MailpitMessage;
      return {
        from: message.From.Address,
        to: message.To[0]?.Address ?? "",
        subject: message.Subject,
        text: message.Text,
        html: message.HTML,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`No llegó ningún correo a ${to} en ${timeoutMs} ms.`);
}

/** Primer link `http(s)://` del texto de un correo. */
export function firstLink(email: CapturedEmail): string {
  const link = email.text.match(/https?:\/\/\S+/)?.[0];
  if (!link) throw new Error("El correo no contiene ningún link.");
  return link;
}
