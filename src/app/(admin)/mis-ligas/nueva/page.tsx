import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { semesterOfDay } from "@/domain/semester";
import { today } from "@/server/time";

import { LeagueForm } from "../league-form";
import { createLeagueAction } from "./actions";

export const metadata: Metadata = { title: "Nueva liga - Liga Futsal" };

export default function NewLeaguePage() {
  return (
    <main className="mx-auto grid w-full max-w-lg gap-6 px-4 py-8">
      <div className="grid gap-1">
        <Link href="/mis-ligas" className="text-sm text-muted-foreground underline">
          Volver a mis ligas
        </Link>
        <h1 className="text-2xl font-semibold">Nueva liga</h1>
      </div>
      <Card>
        <CardContent>
          <LeagueForm
            action={createLeagueAction}
            // RF-17: sugiere el semestre actual según el corte de julio.
            defaultValues={{ name: "", semester: semesterOfDay(today()) }}
            submitLabel="Crear liga"
            pendingLabel="Creando..."
          />
        </CardContent>
      </Card>
    </main>
  );
}
