import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Desactiva las reglas de estilo que se pisan con Prettier.
  prettier,
  {
    // Principio 8 y ADR 016: el dominio es puro. Solo puede importar módulos de
    // src/domain, con ruta relativa del mismo nivel ("./") o con el alias
    // "@/domain/". Cualquier paquete, módulo de Node o ruta que salga de
    // src/domain queda prohibido.
    files: ["src/domain/**/*.{ts,tsx}"],
    // Los tests viven junto al código del dominio pero no son dominio: importan Vitest.
    ignores: ["src/domain/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\./|@/domain/)",
              message:
                "src/domain solo puede importar módulos de src/domain (principio 8, ADR 016). Usa './' o '@/domain/'.",
            },
          ],
        },
      ],
    },
  },
  {
    // ADR 016: los componentes no importan código de servidor; reciben los
    // datos por props desde las páginas o por TanStack Query.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(@/server(/|$)|(\\.\\./)+server(/|$))",
              message:
                "Los componentes no pueden importar src/server (ADR 016). Pasa los datos por props o por TanStack Query.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
