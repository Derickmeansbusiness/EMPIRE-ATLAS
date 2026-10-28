import { LinkButton } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-3">Not in the archive</p>
      <h1 className="editorial-h1 text-4xl">This page does not exist.</h1>
      <p className="mt-3 max-w-md text-sm text-platinum/70">The record you are looking for has not been catalogued, or the link is wrong.</p>
      <div className="mt-6 flex gap-3"><LinkButton href="/">Home</LinkButton><LinkButton href="/command-center" variant="secondary">Command Center</LinkButton></div>
    </main>
  );
}
