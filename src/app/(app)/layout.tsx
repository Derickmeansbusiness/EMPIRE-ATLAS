import { requireUser } from "@/lib/auth/current-user";
import { AppShell } from "@/components/app/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
