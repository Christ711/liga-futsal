import { getHome } from "@/server/queries/home";

import { HomeView } from "./home-view";

// Plan D13: la portada se renderiza en cada visita para mostrar datos vigentes.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { inProgress, finalized } = await getHome();
  return <HomeView inProgress={inProgress} finalized={finalized} />;
}
