import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Date of birth must make the person at least `years` old today. */
export function minimumAge(years: number, today: () => Date = () => new Date()): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null; // leave empty values to Validators.required

    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return { date: true };

    const now = today();
    let age = now.getFullYear() - y;
    const birthdayPassed = now.getMonth() + 1 > m || (now.getMonth() + 1 === m && now.getDate() >= d);
    if (!birthdayPassed) age--;

    return age >= years ? null : { minimumAge: { requiredAge: years, actualAge: age } };
  };
}

/** Accepts "(615) 555-0100", "615.555.0100", etc. as long as it's 10 digits. */
export function usPhone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    return digitsOnly(value).length === 10 ? null : { usPhone: true };
  };
}
