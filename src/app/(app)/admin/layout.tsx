import { requireCapability } from "@/lib/auth/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireCapability("admin:access");
  return <>{children}</>;
}
