import { reviewFlags } from './review-flags';

const base = {
  account: { accountType: 'Individual' as const, initialDeposit: 10000, fundingMethod: 'BankTransfer' as const },
  financial: { employmentStatus: 'Employed' as const, employer: 'Acme', annualIncome: 90000, netWorth: 200000 },
  riskAnswers: [
    { questionId: 'horizon', value: 3 },
    { questionId: 'liquidity', value: 4 }
  ],
  riskProfile: 'Moderate' as const
};

describe('reviewFlags', () => {
  it('returns nothing for an ordinary application', () => {
    expect(reviewFlags(base)).toEqual([]);
  });

  it('flags a deposit that is most of their savings', () => {
    const flags = reviewFlags({ ...base, riskAnswers: [{ questionId: 'liquidity', value: 1 }] });
    expect(flags.map(f => f.title)).toEqual(['Deposit is most of their savings']);
  });

  it('flags a deposit over half of net worth', () => {
    const flags = reviewFlags({ ...base, account: { ...base.account, initialDeposit: 150000 } });
    expect(flags[0].detail).toContain('75%');
  });

  it('flags high risk with a short horizon', () => {
    const flags = reviewFlags({ ...base, riskProfile: 'Aggressive', riskAnswers: [{ questionId: 'horizon', value: 1 }] });
    expect(flags.map(f => f.title)).toEqual(['High risk, short time horizon']);
  });

  it('asks for trust documents on trust accounts', () => {
    const flags = reviewFlags({ ...base, account: { ...base.account, accountType: 'Trust' } });
    expect(flags).toEqual([jasmine.objectContaining({ tone: 'info', title: 'Trust documents needed' })]);
  });
});
