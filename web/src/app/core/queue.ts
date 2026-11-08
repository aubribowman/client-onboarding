// Queue helpers shared by the home page and the review queue: which
// applications are still open, and how long each has been waiting.
import { ApplicationStatus, ApplicationSummary } from './models';

/** Statuses that still need someone to act. */
export const openStatuses: ApplicationStatus[] = ['Submitted', 'InReview', 'NeedsInfo'];

const DAY = 24 * 60 * 60 * 1000;

/** Whole days an open application has waited since it was submitted. Null once decided. */
export function daysWaiting(app: Pick<ApplicationSummary, 'status' | 'submittedAt'>, now = new Date()): number | null {
  if (!openStatuses.includes(app.status)) return null;
  const since = new Date(app.submittedAt).getTime();
  return Number.isNaN(since) ? null : Math.max(0, Math.floor((now.getTime() - since) / DAY));
}

/** Color for the "Waiting" column: amber from two days, red from four.
    Change these thresholds here; the home page's overdue count uses them too. */
export function waitingTone(days: number | null): 'ok' | 'warn' | 'late' | null {
  if (days == null) return null;
  return days >= 4 ? 'late' : days >= 2 ? 'warn' : 'ok';
}
