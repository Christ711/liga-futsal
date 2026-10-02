import { expect, test } from "@playwright/test";

test("la portada abre a 360 px en español", async ({ page }) => {
  await page.goto("/");

  expect(page.viewportSize()?.width).toBe(360);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-CL");
  await expect(page.getByRole("heading", { level: 1, name: "Liga Futsal" })).toBeVisible();
});

test("la API de autenticación responde", async ({ request }) => {
  const response = await request.get("/api/auth/ok");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});
