"use client";

import { Crest } from "@/components/crest/crest";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { GoalTarget, ViewTeam } from "@/lib/matchday-view";

/**
 * Panel inferior para elegir el autor de un gol entre los jugadores actuales
 * de los dos equipos, o "Gol sin autor" de cada uno (RF-53, RF-56). Elegir es
 * el segundo y último toque: no hay confirmación (RNF-1).
 */
export function GoalSheet({
  open,
  onOpenChange,
  title,
  teams,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  teams: ViewTeam[];
  onPick: (target: GoalTarget) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Toca al autor del gol para registrarlo.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-5 px-4 pb-6">
          {teams.map((team) => (
            <section key={team.id} aria-labelledby={`goal-sheet-${team.id}`} className="grid gap-2">
              <h3 id={`goal-sheet-${team.id}`} className="flex items-center gap-2 font-semibold">
                <Crest teamId={team.id} name={team.name} crestHash={team.crestHash} size={28} />
                <span className="min-w-0 wrap-anywhere">{team.name}</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {team.players.map((player) => (
                  <Button
                    key={player.id}
                    type="button"
                    variant="outline"
                    className="h-12 justify-start px-3 text-left whitespace-normal"
                    onClick={() => onPick({ teamId: team.id, scorerId: player.id })}
                  >
                    <span className="line-clamp-2 wrap-anywhere">{player.name}</span>
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 justify-start px-3 text-left whitespace-normal"
                  aria-label={`Gol sin autor de ${team.name}`}
                  onClick={() => onPick({ teamId: team.id, scorerId: null })}
                >
                  Gol sin autor
                </Button>
              </div>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
