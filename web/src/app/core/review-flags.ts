import { ClientApplication } from './models';

export interface ReviewFlag {
  tone: 'warn' | 'info';
  title: string;
  detail: string;
}

type FlagInput = Pick<ClientApplication, 'account' | 'financial' | 'riskAnswers' | 'riskProfile'>;

const answer = (app: FlagInput, id: string) => app.riskAnswers.find(a => a.questionId === id)?.value ?? null;

/** Things a reviewer should check by hand. None of them block a decision. */
export function reviewFlags(app: FlagInput): ReviewFlag[] {
  const flags: ReviewFlag[] = [];
  const { initialDeposit, accountType } = app.account;
  const { netWorth } = app.financial;

  const liquidity = answer(app, 'liquidity');
  if (liquidity !== null && liquidity <= 2) {
    flags.push({
      tone: 'warn',
      title: 'Deposit is most of their savings',
      detail: liquidity === 1 ? 'The client said this is more than 75% of their savings.' : 'The client said this is 50% to 75% of their savings.'
    });
  }

  if (netWorth > 0 && initialDeposit > netWorth * 0.5) {
    flags.push({
      tone: 'warn',
      title: 'Large deposit for their net worth',
      detail: `The deposit is ${Math.round((initialDeposit / netWorth) * 100)}% of the net worth they reported.`
    });
  }

  const horizon = answer(app, 'horizon');
  if (horizon === 1 && (app.riskProfile === 'Growth' || app.riskProfile === 'Aggressive')) {
    flags.push({
      tone: 'warn',
      title: 'High risk, short time horizon',
      detail: `A ${app.riskProfile.toLowerCase()} profile, but they expect to withdraw within 2 years.`
    });
  }

  if (accountType === 'Trust') {
    flags.push({ tone: 'info', title: 'Trust documents needed', detail: 'Confirm the trust agreement and trustee details are on file.' });
  }

  return flags;
}
