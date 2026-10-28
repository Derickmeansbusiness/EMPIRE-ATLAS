import { reviewClaimAction } from "@/app/actions/admin";
import { Button, Field, Select, Textarea } from "@/components/ui/primitives";
import { VERIFICATION_META } from "./status";
import type { VerificationStatus } from "@/db/schema";

export function ReviewForm({ claimId, current, returnTo }: { claimId: string; current: VerificationStatus; returnTo: string }) {
  return (
    <form action={reviewClaimAction} className="space-y-3">
      <input type="hidden" name="claimId" value={claimId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="New verification status" htmlFor={`status-${claimId}`}>
        <Select id={`status-${claimId}`} name="toStatus" defaultValue={current}>
          {(Object.keys(VERIFICATION_META) as VerificationStatus[]).map((s) => <option key={s} value={s}>{VERIFICATION_META[s].label}</option>)}
        </Select>
      </Field>
      <Field label="Review note" htmlFor={`note-${claimId}`} hint="Say what you checked. This is logged with your name."><Textarea id={`note-${claimId}`} name="note" className="min-h-20" /></Field>
      <Button type="submit" variant="secondary">Record review</Button>
    </form>
  );
}
