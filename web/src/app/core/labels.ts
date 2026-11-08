import { AccountType, ApplicationStatus, EmploymentStatus, FundingMethod, RiskProfile } from './models';

// One place for display text, so the API's enum names never leak into the UI.
export const accountTypeLabels: Record<AccountType, string> = {
  Individual: 'Individual',
  Joint: 'Joint',
  TraditionalIra: 'Traditional IRA',
  RothIra: 'Roth IRA',
  Trust: 'Trust'
};

export const fundingMethodLabels: Record<FundingMethod, string> = {
  BankTransfer: 'Bank transfer (ACH)',
  AccountTransfer: 'Transfer from another firm',
  Check: 'Check'
};

export const employmentLabels: Record<EmploymentStatus, string> = {
  Employed: 'Employed',
  SelfEmployed: 'Self-employed',
  Retired: 'Retired',
  Student: 'Student',
  NotEmployed: 'Not employed'
};

export const statusLabels: Record<ApplicationStatus, string> = {
  Submitted: 'Submitted',
  InReview: 'In review',
  NeedsInfo: 'Needs info',
  Approved: 'Approved',
  Declined: 'Declined'
};

// Verb form for the reviewer's action buttons.
export const statusActions: Record<ApplicationStatus, string> = {
  Submitted: 'Resubmit',
  InReview: 'Start review',
  NeedsInfo: 'Request info',
  Approved: 'Approve',
  Declined: 'Decline'
};

export const riskProfileDescriptions: Record<RiskProfile, string> = {
  Conservative: 'Prioritizes protecting principal over growth.',
  Moderate: 'Accepts some ups and downs for modest growth.',
  Growth: 'Comfortable with swings in pursuit of long-term growth.',
  Aggressive: 'Seeks maximum growth and can ride out large losses.'
};

/** 6155550100 -> (615) 555-0100 */
export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digits;
}

/** Turns a label map into a list for @for loops over chips and <select> options. */
export function entries<K extends string>(labels: Record<K, string>): { value: K; label: string }[] {
  return (Object.keys(labels) as K[]).map(value => ({ value, label: labels[value] }));
}
