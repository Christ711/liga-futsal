/** Partido por jugar entre dos equipos; el orden A/B no significa local ni visita (RF-47). */
export type Pairing = {
  teamAId: string;
  teamBId: string;
};

/** Un partido por cada par de equipos de la liga (RF-42). */
export function roundRobinPairs(teamIds: readonly string[]): Pairing[] {
  if (new Set(teamIds).size !== teamIds.length) {
    throw new Error("La lista de equipos tiene un equipo repetido.");
  }
  const pairs: Pairing[] = [];
  teamIds.forEach((teamAId, index) => {
    for (const teamBId of teamIds.slice(index + 1)) {
      pairs.push({ teamAId, teamBId });
    }
  });
  return pairs;
}

/** Generador aleatorio en [0, 1). Se inyecta para que el dominio no dependa de `Math.random`. */
export type Random = () => number;

function sharesTeam(a: Pairing, b: Pairing): boolean {
  return (
    a.teamAId === b.teamAId ||
    a.teamAId === b.teamBId ||
    a.teamBId === b.teamAId ||
    a.teamBId === b.teamBId
  );
}

function samePair(a: Pairing, b: Pairing): boolean {
  return (
    (a.teamAId === b.teamAId && a.teamBId === b.teamBId) ||
    (a.teamAId === b.teamBId && a.teamBId === b.teamAId)
  );
}

/** Cantidad de pares de partidos consecutivos que comparten un equipo. */
export function countConsecutiveRepeats(order: readonly Pairing[]): number {
  let repeats = 0;
  for (let index = 1; index < order.length; index += 1) {
    if (sharesTeam(order[index - 1]!, order[index]!)) repeats += 1;
  }
  return repeats;
}

function shuffle<T>(items: readonly T[], random: Random): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!];
  }
  return shuffled;
}

/**
 * Busca por retroceso un orden de `pairs` con a lo más `allowedRepeats` pares de
 * partidos consecutivos que comparten un equipo y que no abra con
 * `forbiddenOpener`. Devuelve `null` si no existe.
 */
function findOrder(
  pairs: readonly Pairing[],
  allowedRepeats: number,
  forbiddenOpener: Pairing | null,
): Pairing[] | null {
  const used = new Array<boolean>(pairs.length).fill(false);
  const order: Pairing[] = [];

  const place = (repeatsLeft: number): boolean => {
    if (order.length === pairs.length) return true;
    const previous = order[order.length - 1];
    for (let index = 0; index < pairs.length; index += 1) {
      if (used[index]) continue;
      const candidate = pairs[index]!;
      if (previous === undefined && forbiddenOpener && samePair(candidate, forbiddenOpener)) {
        continue;
      }
      const repeats = previous !== undefined && sharesTeam(previous, candidate);
      if (repeats && repeatsLeft === 0) continue;
      used[index] = true;
      order.push(candidate);
      if (place(repeats ? repeatsLeft - 1 : repeatsLeft)) return true;
      order.pop();
      used[index] = false;
    }
    return false;
  };

  return place(allowedRepeats) ? order : null;
}

/**
 * Genera los partidos de una fecha, todos contra todos, en un orden con la menor
 * cantidad posible de pares de partidos consecutivos que comparten un equipo
 * (RF-44). Ese mínimo es 2 con 3 o 4 equipos y 0 desde 5.
 *
 * Si se entrega `previousOpener` (el primer partido del orden final de la fecha
 * cronológicamente anterior), el primer partido no enfrenta a ese mismo par
 * (RF-45). Por simetría, esa restricción no cambia el mínimo de consecutivos.
 */
export function scheduleMatchday(options: {
  teamIds: readonly string[];
  random: Random;
  previousOpener?: Pairing | null;
}): Pairing[] {
  const pairs = shuffle(roundRobinPairs(options.teamIds), options.random);
  // Se sube el máximo permitido de a uno: el primer nivel con solución es el mínimo.
  for (let allowedRepeats = 0; allowedRepeats < pairs.length; allowedRepeats += 1) {
    const order = findOrder(pairs, allowedRepeats, options.previousOpener ?? null);
    if (order) return order;
  }
  return pairs;
}
