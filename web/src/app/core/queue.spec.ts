import { daysWaiting, waitingTone } from './queue';

describe('queue timing', () => {
  const now = new Date('2026-11-07T12:00:00Z');

  it('counts whole days for open applications', () => {
    expect(daysWaiting({ status: 'InReview', submittedAt: '2026-11-04T13:00:00Z' }, now)).toBe(2);
    expect(daysWaiting({ status: 'Submitted', submittedAt: '2026-11-07T09:00:00Z' }, now)).toBe(0);
  });

  it('stops counting once a decision is made', () => {
    expect(daysWaiting({ status: 'Approved', submittedAt: '2026-10-01T00:00:00Z' }, now)).toBeNull();
  });

  it('turns amber at two days and red at four', () => {
    expect(waitingTone(1)).toBe('ok');
    expect(waitingTone(2)).toBe('warn');
    expect(waitingTone(4)).toBe('late');
    expect(waitingTone(null)).toBeNull();
  });
});
