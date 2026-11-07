import { scoreRisk } from './risk';

describe('scoreRisk', () => {
  it('returns null until every question is answered', () => {
    expect(scoreRisk([4, 3, null, 2, 1])).toBeNull();
    expect(scoreRisk([])).toBeNull();
  });

  it('maps score ranges to profiles at the boundaries', () => {
    expect(scoreRisk([1, 1, 2, 2, 2])?.profile).toBe('Conservative'); // 8
    expect(scoreRisk([1, 2, 2, 2, 2])?.profile).toBe('Moderate');     // 9
    expect(scoreRisk([3, 3, 2, 2, 2])?.profile).toBe('Moderate');     // 12
    expect(scoreRisk([3, 3, 3, 2, 2])?.profile).toBe('Growth');       // 13
    expect(scoreRisk([4, 4, 4, 4, 1])?.profile).toBe('Aggressive');   // 17
  });

  it('sums the answers', () => {
    expect(scoreRisk([4, 4, 4, 4, 4])?.score).toBe(20);
  });
});
