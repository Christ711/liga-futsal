import { describe, expect, it } from "vitest";

import { resetTestDatabase } from "../support/reset-test-database";

describe("resetTestDatabase", () => {
  it("rechaza reiniciar la base de desarrollo", async () => {
    await expect(
      resetTestDatabase("postgresql://postgres@127.0.0.1:5433/liga_dev"),
    ).rejects.toThrow(/Reinicio rechazado/);
  });

  it("rechaza reiniciar una base permitida en un host remoto fuera de CI", async () => {
    const previousCi = process.env.CI;
    delete process.env.CI;
    try {
      await expect(
        resetTestDatabase("postgresql://user:pass@ep-ejemplo-pooler.neon.tech/liga_integration"),
      ).rejects.toThrow(/Reinicio rechazado/);
    } finally {
      if (previousCi !== undefined) process.env.CI = previousCi;
    }
  });
});
