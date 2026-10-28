import Link from "next/link";
import { Wordmark } from "@/components/ui/brand";
import { LinkButton } from "@/components/ui/primitives";
import type { User } from "@/db/schema";

const links = [
  { href: "/explore", label: "Explore the Empires" },
  { href: "/investigations", label: "Investigations" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/deal-archaeology", label: "Deal Archaeology" },
  { href: "/capital-lab", label: "Capital Lab" },
  { href: "/simulations", label: "Simulations" },
  { href: "/methodology", label: "Methodology" },
  { href: "/membership", label: "Membership" },
];

export function PublicNav({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-40 border-b hairline bg-obsidian/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Wordmark />
        <nav aria-label="Primary" className="hidden items-center gap-5 text-[0.8rem] text-platinum/80 lg:flex">
          {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-gold transition-colors focus-ring rounded">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          {user ? <LinkButton href="/command-center" className="px-3 py-2 text-xs">Command Center</LinkButton> : (
            <>
              <LinkButton href="/sign-in" variant="ghost" className="px-3 py-2 text-xs">Sign In</LinkButton>
              <LinkButton href="/sign-up" className="px-3 py-2 text-xs">Begin Research</LinkButton>
            </>
          )}
        </div>
      </div>
      <details className="lg:hidden border-t hairline">
        <summary className="cursor-pointer list-none px-4 py-2 text-xs uppercase tracking-[0.2em] text-gold">Menu</summary>
        <nav aria-label="Primary mobile" className="grid grid-cols-2 gap-1 px-4 pb-3 text-sm">
          {links.map((l) => <Link key={l.href} href={l.href} className="rounded px-2 py-2 text-platinum/85 hover:bg-white/5">{l.label}</Link>)}
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t hairline mt-24">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-mist">Study the empires. Decode the capital. Engineer the future. Empire Atlas is a research and modelling environment, not investment advice.</p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3">Research</p>
          <ul className="space-y-2 text-platinum/80">
            <li><Link href="/explore" className="hover:text-gold">Explore the Empires</Link></li>
            <li><Link href="/deal-archaeology" className="hover:text-gold">Deal Archaeology</Link></li>
            <li><Link href="/methodology" className="hover:text-gold">Research Methodology</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3">Platform</p>
          <ul className="space-y-2 text-platinum/80">
            <li><Link href="/how-it-works" className="hover:text-gold">How It Works</Link></li>
            <li><Link href="/membership" className="hover:text-gold">Membership</Link></li>
            <li><Link href="/sign-in" className="hover:text-gold">Sign In</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t hairline py-4 text-center text-[0.65rem] tracking-[0.2em] text-slate-mist uppercase">Empire Atlas · Evidence first · Historical claims carry verification status</div>
    </footer>
  );
}
