"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { deleteModel, saveModel, MODEL_KIND_PATH } from "@/lib/data/models";
import { safeReturnTo, saveModelSchema } from "@/lib/validation";

export interface ModelFormState { error?: string }

export async function saveModelAction(_prev: ModelFormState, formData: FormData): Promise<ModelFormState> {
  const user = await requireUser();
  const parsed = saveModelSchema.safeParse({
    name: formData.get("name"), kind: formData.get("kind"), assumptions: formData.get("assumptions") ?? "{}",
    transactionId: formData.get("transactionId") || null, modelId: formData.get("modelId") || null, note: formData.get("note") || null, returnTo: formData.get("returnTo") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Could not save the model." };
  const db = await getDb();
  const saved = await saveModel(db, user.id, parsed.data);
  if (!saved) return { error: "Model not found." };
  revalidatePath("/lab/models"); revalidatePath("/command-center");
  const base = safeReturnTo(parsed.data.returnTo, MODEL_KIND_PATH[parsed.data.kind]);
  redirect(`${base}${base.includes("?") ? "&" : "?"}model=${saved.id}&saved=1`);
}

export async function deleteModelAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const db = await getDb();
  await deleteModel(db, user.id, String(formData.get("modelId") ?? ""));
  revalidatePath("/lab/models");
  redirect("/lab/models?deleted=1");
}
