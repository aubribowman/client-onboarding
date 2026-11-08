import { readDraftSummary } from './draft';

const storage = (value: string | null) => ({ getItem: () => value });

describe('readDraftSummary', () => {
  it('describes a saved draft', () => {
    const saved = JSON.stringify({ furthest: 2, draft: { personal: { firstName: 'Ana', lastName: 'Ruiz' } } });
    expect(readDraftSummary(storage(saved))).toEqual({ clientName: 'Ana Ruiz', stepsReached: 3 });
  });

  it('handles a draft with no name yet', () => {
    const saved = JSON.stringify({ furthest: 0, draft: { personal: { firstName: '', lastName: '' } } });
    expect(readDraftSummary(storage(saved))).toEqual({ clientName: null, stepsReached: 1 });
  });

  it('returns null when nothing is saved or the data is broken', () => {
    expect(readDraftSummary(storage(null))).toBeNull();
    expect(readDraftSummary(storage('{oops'))).toBeNull();
  });
});
