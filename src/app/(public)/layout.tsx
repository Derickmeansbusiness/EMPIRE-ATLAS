import { PublicNav, SiteFooter } from "@/components/site/public-nav";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <PublicNav user={user} />
      <main id="main" className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
