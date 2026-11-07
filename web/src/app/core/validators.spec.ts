import { FormControl } from '@angular/forms';
import { minimumAge, usPhone } from './validators';

describe('minimumAge', () => {
  const today = () => new Date(2026, 10, 6); // Nov 6, 2026
  const validator = minimumAge(18, today);
  const check = (dob: string) => validator(new FormControl(dob));

  it('passes on the 18th birthday', () => {
    expect(check('2008-11-06')).toBeNull();
  });

  it('fails the day before the 18th birthday', () => {
    expect(check('2008-11-07')).toEqual({ minimumAge: { requiredAge: 18, actualAge: 17 } });
  });

  it('ignores empty values so required can report them', () => {
    expect(check('')).toBeNull();
  });
});

describe('usPhone', () => {
  const check = (v: string) => usPhone()(new FormControl(v));

  it('accepts common formats', () => {
    expect(check('(615) 555-0100')).toBeNull();
    expect(check('615.555.0100')).toBeNull();
  });

  it('rejects the wrong number of digits', () => {
    expect(check('555-0100')).toEqual({ usPhone: true });
  });
});
