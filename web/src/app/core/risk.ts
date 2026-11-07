import { RiskProfile } from './models';

// Client-side preview of the score. The API recalculates on submit and
// its answer is the one that gets stored; keep these thresholds in sync
// with api/Services/RiskQuestionnaire.cs.
export const riskProfiles: RiskProfile[] = ['Conservative', 'Moderate', 'Growth', 'Aggressive'];

export function scoreRisk(values: (number | null)[]): { score: number; profile: RiskProfile } | null {
  if (values.length === 0 || values.some(v => v === null)) return null;
  const score = (values as number[]).reduce((sum, v) => sum + v, 0);
  const profile: RiskProfile =
    score <= 8 ? 'Conservative' : score <= 12 ? 'Moderate' : score <= 16 ? 'Growth' : 'Aggressive';
  return { score, profile };
}
