import "./_env";
import fs from "node:fs";
import path from "node:path";

/** Deletes the embedded local database. Refuses to touch a remote DATABASE_URL. */
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0) {
  console.error("[atlas] db:reset only removes the embedded PGlite database. DATABASE_URL is set; refusing to run destructive operations against a remote database.");
  process.exit(1);
}
const dir = path.resolve(process.env.ATLAS_DATA_DIR ?? ".data/pglite");
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(`[atlas] removed ${dir}`);
} else {
  console.log(`[atlas] nothing to remove at ${dir}`);
}
