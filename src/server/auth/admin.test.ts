import { describe, expect, it } from "vitest";

import { isAdminEmail } from "./admin";

describe("isAdminEmail (RF-112)", () => {
  const admins = ["admin@example.com"];

  it("reconoce un correo de la lista sin importar mayúsculas ni espacios", () => {
    expect(isAdminEmail(" Admin@Example.COM ", admins)).toBe(true);
  });

  it("no reconoce un correo que no está en la lista, ni a nadie con la lista vacía", () => {
    expect(isAdminEmail("otro@example.com", admins)).toBe(false);
    expect(isAdminEmail("admin@example.com", [])).toBe(false);
  });
});
