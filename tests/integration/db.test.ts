import { afterAll, describe, expect, it } from "vitest";

import { db } from "@/server/db/client";

describe("base de integración", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  it("responde SELECT 1 con el cliente de Prisma", async () => {
    const rows = await db.$queryRaw<{ one: number }[]>`SELECT 1 AS one`;

    expect(rows).toEqual([{ one: 1 }]);
  });

  it("usa su propia base, separada de la de desarrollo y la de E2E", async () => {
    const rows = await db.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;

    expect(rows).toEqual([{ name: "liga_integration" }]);
  });
});
