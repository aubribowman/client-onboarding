import { formatMoney, formatPhoneInput } from './formatted-inputs';

describe('formatted inputs', () => {
  it('adds thousands separators', () => {
    expect(formatMoney(1250000)).toBe('1,250,000');
    expect(formatMoney(950)).toBe('950');
    expect(formatMoney(null)).toBe('');
  });

  it('formats a phone number as it grows', () => {
    expect(formatPhoneInput('6')).toBe('(6');
    expect(formatPhoneInput('6155')).toBe('(615) 5');
    expect(formatPhoneInput('6155550199')).toBe('(615) 555-0199');
    expect(formatPhoneInput('(615) 555-01999')).toBe('(615) 555-0199');
    expect(formatPhoneInput('')).toBe('');
  });
});
