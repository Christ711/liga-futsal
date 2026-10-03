import "server-only";

export type EmailContent = {
  subject: string;
  text: string;
  html: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** Correo con el link para definir una contraseña nueva (RF-10). El link vence en 1 hora (RF-11). */
export function passwordResetEmail(link: string): EmailContent {
  const safeLink = escapeHtml(link);
  return {
    subject: "Recupera tu contraseña de Liga Futsal",
    text: [
      "Hola:",
      "",
      "Recibimos una solicitud para definir una contraseña nueva de tu cuenta de Liga Futsal.",
      "Abre este link para elegirla:",
      "",
      link,
      "",
      "El link vence en 1 hora y solo se puede usar una vez.",
      "Si no pediste este cambio, ignora este correo: tu contraseña sigue siendo la misma.",
    ].join("\n"),
    html: [
      "<p>Hola:</p>",
      "<p>Recibimos una solicitud para definir una contraseña nueva de tu cuenta de Liga Futsal.</p>",
      `<p><a href="${safeLink}">Elegir una contraseña nueva</a></p>`,
      `<p>Si el botón no funciona, copia este link en tu navegador:<br>${safeLink}</p>`,
      "<p>El link vence en 1 hora y solo se puede usar una vez.</p>",
      "<p>Si no pediste este cambio, ignora este correo: tu contraseña sigue siendo la misma.</p>",
    ].join("\n"),
  };
}
