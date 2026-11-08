/** Where the wizard keeps an unfinished application on this device. */
export const DRAFT_KEY = 'onboarding-draft';

export interface DraftSummary {
  /** The client's name, or null if it hasn't been entered yet. */
  clientName: string | null;
  /** How many steps have been reached (1–5). */
  stepsReached: number;
}

/** Reads just enough of the saved draft to describe it. Null when there isn't one. */
export function readDraftSummary(storage: Pick<Storage, 'getItem'> = localStorage): DraftSummary | null {
  try {
    const saved = storage.getItem(DRAFT_KEY);
    if (!saved) return null;
    const { draft, furthest } = JSON.parse(saved);
    const name = [draft?.personal?.firstName, draft?.personal?.lastName].filter(Boolean).join(' ').trim();
    return { clientName: name || null, stepsReached: (Number(furthest) || 0) + 1 };
  } catch {
    return null;
  }
}
