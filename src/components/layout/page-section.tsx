import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Bloque con título de una página; el título le da nombre a la región para lectores de pantalla. */
export function PageSection({
  id,
  title,
  description,
  level = 2,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  /** Las subpáginas de una sola sección usan el título como encabezado principal. */
  level?: 1 | 2;
  children: ReactNode;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardHeader>
          <CardTitle>
            <Heading id={id} className="text-lg">
              {title}
            </Heading>
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
