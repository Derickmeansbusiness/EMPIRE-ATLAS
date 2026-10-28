import "./_env";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { users, type UserRole } from "../src/db/schema";
import { setUserRole } from "../src/lib/auth/service";

/**
 * Operator-only role grant (runs with database access, never from the web UI):
 *   pnpm atlas:grant-role --email you@example.com --role platform_owner [--researcher-number 1]
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email"); const role = arg("role") as UserRole | undefined; const rn = arg("researcher-number");
  if (!email || !role) { console.error("Usage: pnpm atlas:grant-role --email <email> --role <role> [--researcher-number <n>]"); process.exit(1); }
  const database = await createDatabase();
  await runMigrations(database);
  const user = await database.db.query.users.findFirst({ where: eq(users.emailNormalized, email.trim().toLowerCase()) });
  if (!user) { console.error(`[atlas] no user with email ${email}`); process.exit(1); }
  const updated = await setUserRole(database.db, null, user.id, role, rn ? Number(rn) : undefined);
  console.log(`[atlas] ${updated.email} is now ${updated.role}${updated.researcherNumber ? ` (Researcher ${String(updated.researcherNumber).padStart(3, "0")})` : ""}`);
  await database.close();
}
main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
