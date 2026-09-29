import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">Liga Futsal</h1>
      <Button>Ver ligas</Button>
    </main>
  );
}
