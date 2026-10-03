import { describe, expect, it } from "vitest";

import { matchdayDeletionWarning } from "./matchday-deletion-warning";

describe("aviso al eliminar una fecha (RF-51)", () => {
  it("cuenta los partidos terminados que se pierden", () => {
    expect(matchdayDeletionWarning(0)).toBe(
      "No tiene partidos terminados. Esta acción no se puede deshacer.",
    );
    expect(matchdayDeletionWarning(1)).toBe(
      "Se perderá 1 partido terminado con sus goles, y las tablas se recalcularán. Esta acción no se puede deshacer.",
    );
    expect(matchdayDeletionWarning(3)).toBe(
      "Se perderán 3 partidos terminados con sus goles, y las tablas se recalcularán. Esta acción no se puede deshacer.",
    );
  });
});
