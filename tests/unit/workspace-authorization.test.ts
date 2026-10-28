import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { freshDatabase } from "./helpers/db";
import type { AtlasDatabase } from "@/db/client";
import { createUser } from "@/lib/auth/service";
import { createNote, deleteNote, getNote, listBookmarks, listNotes, toggleBookmark, updateNote, workspaceSummary } from "@/lib/data/workspace";
import { seedResearch } from "@/db/seed";
import { getDossier } from "@/lib/data/research";

let database: AtlasDatabase; let alice: string; let bob: string; let claimId: string;

beforeAll(async () => {
  database = await freshDatabase();
  await seedResearch(database.db);
  alice = (await createUser(database.db, { email: "alice@example.com", password: "alice-passphrase-1", displayName: "Alice" })).id;
  bob = (await createUser(database.db, { email: "bob@example.com", password: "bob-passphrase-123", displayName: "Bob" })).id;
  const dossier = await getDossier(database.db, "sam-zell");
  claimId = dossier!.claims[0]!.id;
});
afterAll(async () => { await database.close(); });

describe("private notes are scoped to their owner", () => {
  it("another user cannot read, update or delete a note", async () => {
    const note = await createNote(database.db, alice, { title: "Alice's note", body: "private", linkedKind: "claim", linkedId: claimId });
    expect(await getNote(database.db, alice, note.id)).not.toBeNull();
    expect(await getNote(database.db, bob, note.id)).toBeNull();
    expect(await updateNote(database.db, bob, note.id, { title: "hijacked" })).toBeNull();
    expect(await deleteNote(database.db, bob, note.id)).toBe(false);
    expect((await listNotes(database.db, bob)).length).toBe(0);
    expect((await listNotes(database.db, alice, { linkedKind: "claim", linkedId: claimId })).length).toBe(1);
    expect(await deleteNote(database.db, alice, note.id)).toBe(true);
  });
});

describe("bookmarks", () => {
  it("toggle on/off and list only the owner's bookmarks", async () => {
    expect(await toggleBookmark(database.db, alice, "claim", claimId)).toEqual({ bookmarked: true });
    expect((await listBookmarks(database.db, alice)).length).toBe(1);
    expect((await listBookmarks(database.db, bob)).length).toBe(0);
    expect((await listBookmarks(database.db, alice))[0]!.claim?.id).toBe(claimId);
    expect(await toggleBookmark(database.db, alice, "claim", claimId)).toEqual({ bookmarked: false });
    expect((await listBookmarks(database.db, alice)).length).toBe(0);
  });
  it("summary counts derive from stored records", async () => {
    await createNote(database.db, bob, { title: "n1", body: "" });
    await toggleBookmark(database.db, bob, "claim", claimId);
    const s = await workspaceSummary(database.db, bob);
    expect(s.notes).toBe(1);
    expect(s.bookmarks).toBe(1);
  });
});
