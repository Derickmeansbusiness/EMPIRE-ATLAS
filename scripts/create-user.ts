import "./_env";
import { createDatabase } from "../src/db/client";
import { runMigrations } from "../src/db/migrate";
import { createUser } from "../src/lib/auth/service";
import type { UserRole } from "../src/db/schema";

/**
 * Administrator-controlled account creation.
 *   pnpm atlas:create-user --email you@example.com --name "Your Name" --role platform_owner --researcher-number 1
 * The password is read from ATLAS_NEW_USER_PASSWORD (never from argv, which is visible in process lists).
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email"); const name = arg("name") ?? "Researcher";
  const role = (arg("role") ?? "student") as UserRole;
  const rn = arg("researcher-number");
  const password = process.env.ATLAS_NEW_USER_PASSWORD;
  if (!email || !password) {
    console.error("Usage: ATLAS_NEW_USER_PASSWORD=... pnpm atlas:create-user --email <email> --name <name> [--role <role>] [--researcher-number <n>]");
    process.exit(1);
  }
  const database = await createDatabase();
  await runMigrations(database);
  const user = await createUser(database.db, { email, password, displayName: name, role, researcherNumber: rn ? Number(rn) : null });
  console.log(`[atlas] created ${user.email} as ${user.role}${user.researcherNumber ? ` (Researcher ${String(user.researcherNumber).padStart(3, "0")})` : ""}`);
  await database.close();
}
main().catch((err) => { console.error(err.message ?? err); process.exit(1); });
