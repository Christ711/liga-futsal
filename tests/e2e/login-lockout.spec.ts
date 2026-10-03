import { expect, test } from "@playwright/test";

import { apiPost, createAccount, formAlert, signIn } from "./helpers/accounts";

const LOCKOUT_MESSAGE = "Demasiados intentos fallidos. Vuelve a intentarlo en 15 minutos.";

test("tras 5 intentos fallidos, rechaza incluso la contraseña correcta (RF-7)", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await signIn(page, account.email, `incorrecta-${attempt}`);
    await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
  }

  await signIn(page, account.email, account.password);

  await expect(formAlert(page)).toHaveText(LOCKOUT_MESSAGE);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toHaveCount(0);
});

test("con 4 intentos fallidos todavía se puede entrar con la contraseña correcta", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    await signIn(page, account.email, `incorrecta-${attempt}`);
    await expect(formAlert(page)).toHaveText("Correo o contraseña incorrectos.");
  }

  await signIn(page, account.email, account.password);

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

test("el bloqueo también cuenta los intentos hechos directo contra la API", async ({
  page,
  request,
}) => {
  const account = await createAccount(request);

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await apiPost(request, "/api/auth/sign-in/email", {
      data: { email: account.email, password: `incorrecta-${attempt}` },
    });
    expect(response.status()).toBe(401);
  }
  const blocked = await apiPost(request, "/api/auth/sign-in/email", {
    data: { email: account.email, password: account.password },
  });
  expect(blocked.status()).toBe(429);

  await signIn(page, account.email, account.password);
  await expect(formAlert(page)).toHaveText(LOCKOUT_MESSAGE);
});

test("el bloqueo de un correo no afecta a otra cuenta", async ({ page, request }) => {
  const blocked = await createAccount(request);
  const other = await createAccount(request);
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    await apiPost(request, "/api/auth/sign-in/email", {
      data: { email: blocked.email, password: `incorrecta-${attempt}` },
    });
  }

  await signIn(page, other.email, other.password);

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});
