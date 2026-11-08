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

/** Amber from two days, red from four. */
export function waitingTone(days: number | null): 'ok' | 'warn' | 'late' | null {
  if (days == null) return null;
  return days >= 4 ? 'late' : days >= 2 ? 'warn' : 'ok';
}
