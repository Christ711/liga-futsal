const IRREVERSIBLE = "Esta acción no se puede deshacer.";

/** Advertencia del diálogo de eliminar un equipo: qué se borra con él (RF-95, RF-96). */
export function teamDeletionWarning({
  playerCount,
  hasCrest,
}: {
  playerCount: number;
  hasCrest: boolean;
}): string {
  if (playerCount === 0) {
    const crest = hasCrest ? " También se eliminará su escudo." : "";
    return `El equipo no tiene jugadores.${crest} ${IRREVERSIBLE}`;
  }
  const players =
    playerCount === 1 ? "se eliminará su jugador" : `se eliminarán sus ${playerCount} jugadores`;
  return `También ${players}${hasCrest ? " y su escudo" : ""}. ${IRREVERSIBLE}`;
}
