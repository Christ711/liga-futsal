import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Tarjeta de las pantallas de cuenta: título, descripción, formulario y enlaces al pie. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      </Card>
    </main>
  );
}
