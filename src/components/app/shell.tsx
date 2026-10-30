import Link from "next/link";
import { BarChart3, BookMarked, ClipboardCheck, Bot, Building, Building2, Calendar, Clock, FileSearch, FlaskConical, Gavel, GraduationCap, LayoutDashboard, Library, ListChecks, Network, NotebookPen, ScrollText, Settings, ShieldCheck, Swords, Users } from "lucide-react";
import { Wordmark } from "@/components/ui/brand";
import { NavLink } from "./nav-link";
import { signOutAction } from "@/app/actions/auth";
import { can } from "@/lib/auth/roles";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { researcherLabel } from "@/lib/format";
import type { User } from "@/db/schema";

const groups = [
  { title: "Research", items: [
    { href: "/command-center", label: "Command Center", icon: LayoutDashboard },
    { href: "/dossiers", label: "Empire Dossiers", icon: ScrollText },
    { href: "/timeline", label: "Historical Timeline", icon: Clock },
    { href: "/deals", label: "Deal Archaeology", icon: Building2 },
    { href: "/evidence/sources", label: "Sources & Evidence", icon: FileSearch },
    { href: "/network", label: "Capital Network", icon: Network },
    { href: "/library", label: "Research Library", icon: Library },
  ] },
  { title: "Practice", items: [
    { href: "/lab", label: "Capital Architecture Lab", icon: FlaskConical },
    { href: "/simulator", label: "Empire Simulator", icon: Swords },
    { href: "/committee", label: "Investment Committee", icon: Gavel },
  ] },
  { title: "Fieldbook", items: [
    { href: "/fieldbook", label: "The Investor’s Fieldbook", icon: ClipboardCheck },
  ] },
  { title: "Study", items: [
    { href: "/synthesis", label: "Strategy Synthesis", icon: NotebookPen },
    { href: "/doctrine", label: "My Investment Doctrine", icon: BookMarked },
    { href: "/ritual", label: "Weekly Ritual", icon: Calendar },
    { href: "/program", label: "Six-Month Program", icon: ListChecks },
    { href: "/quizzes", label: "Quizzes & Challenges", icon: GraduationCap },
    { href: "/historian", label: "AI Historian", icon: Bot },
  ] },
];

export function AppShell({ user, children }: { user: User; children: React.ReactNode }) {
  const isAdmin = can(user.role, "admin:access");
  const nav = (
    <nav aria-label="Application" className="flex flex-col gap-6 text-sm">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="eyebrow mb-2 px-2">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}><NavLink href={href}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> <span>{label}</span></NavLink></li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <NavLink href="/roadmap" muted><BookMarked className="h-4 w-4" aria-hidden="true" /> Platform roadmap</NavLink>
      </div>
      {isAdmin && (
        <div>
          <p className="eyebrow mb-2 px-2">Administration</p>
          <ul className="space-y-0.5">
            {[{ href: "/admin", label: "Research CMS", icon: ShieldCheck, exact: true }, { href: "/admin/claims", label: "Claims Verification", icon: FileSearch, exact: false }, { href: "/admin/users", label: "User Management", icon: Users, exact: false }, { href: "/admin/organizations", label: "Organizations & Cohorts", icon: Building, exact: false }, { href: "/admin/analytics", label: "Platform Analytics", icon: BarChart3, exact: false }].map(({ href, label, icon: Icon, exact }) => (
              <li key={href}><NavLink href={href} exact={exact}><Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {label}</NavLink></li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );

  return (
    <div className="relative z-10 min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r hairline bg-midnight/60 p-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Wordmark href="/command-center" />
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        <UserCard user={user} />
      </aside>
      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b hairline bg-obsidian/85 px-4 py-3 backdrop-blur-md lg:hidden">
          <Wordmark href="/command-center" compact />
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-md border border-platinum/20 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-gold">Menu</summary>
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-card border hairline bg-midnight p-4 shadow-card">
              {nav}
              <div className="mt-4"><UserCard user={user} /></div>
            </div>
          </details>
        </header>
        <main id="main" className="flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  const rn = researcherLabel(user.researcherNumber);
  return (
    <div className="mt-4 rounded-card border hairline bg-obsidian/60 p-3 text-xs">
      <p className="font-medium text-ivory">{user.displayName}</p>
      <p className="mt-0.5 text-slate-mist">{rn ? `${rn} · ` : ""}{ROLE_LABELS[user.role]}</p>
      <div className="mt-3 flex items-center justify-between">
        <Link href="/profile" className="flex items-center gap-1 text-platinum/80 hover:text-gold"><Settings className="h-3.5 w-3.5" aria-hidden="true" /> Profile</Link>
        <form action={signOutAction}><button type="submit" className="text-platinum/80 hover:text-risk focus-ring rounded">Sign out</button></form>
      </div>
    </div>
  );
}
