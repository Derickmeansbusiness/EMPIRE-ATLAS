/** Human-readable labels for research_progress activity kinds. */
const LABELS: Record<string, string> = {
  "dossier.opened": "Opened a dossier", "transaction.opened": "Opened a transaction", "case.opened": "Opened a case", "institution.opened": "Opened an institution",
  "note.created": "Wrote a note", "bookmark.created": "Saved a bookmark", "model.saved": "Saved a financial model", "simulation.started": "Started a simulation",
  "simulation.completed": "Completed a simulation", "committee.submitted": "Submitted to the committee", "principle.saved": "Saved a principle",
  "synthesis.compared": "Compared strategies", "ritual.completed": "Completed a ritual day", "quiz.passed": "Passed a quiz", "quiz.attempted": "Attempted a quiz", "doctrine.exported": "Exported the doctrine",
  "passage.read": "Read a passage analysis", "passage.added": "Added a source passage", "challenge.attempted": "Attempted an underwriting challenge", "walk.started": "Started a property walk", "walk.completed": "Completed a property walk", "finding.recorded": "Recorded a finding", "report.saved": "Saved a property report",
};
export function activityLabel(kind: string): string { return LABELS[kind] ?? kind.replace(/[._]/g, " "); }
