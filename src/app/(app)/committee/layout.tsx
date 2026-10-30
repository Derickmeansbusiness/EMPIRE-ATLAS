import { requireFeature } from "@/lib/auth/current-user";

export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireFeature("committee");
  return <>{children}</>;
}
