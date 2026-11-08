// Inputs that format themselves as the person types: money gets commas,
// phone numbers get "(615) 555-0199". Add appMoney or appPhone to an
// <input> that has a formControlName and it works with reactive forms.
import { Directive, ElementRef, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** "1234567" -> "1,234,567". Empty for null. */
export function formatMoney(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? '' : Math.trunc(value).toLocaleString('en-US');
}

/** Builds "(615) 555-0199" as the person types; extra digits are dropped. */
export function formatPhoneInput(raw: string | null | undefined): string {
  const d = (raw ?? '').replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Keeps the caret after the same number of digits once the text is reformatted.
    Without this, the caret jumps to the end whenever a comma or bracket is added. */
function reformat(el: HTMLInputElement, next: string): void {
  const caret = el.selectionStart ?? el.value.length;
  const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length;
  el.value = next;
  let pos = 0;
  for (let seen = 0; pos < next.length && seen < digitsBefore; pos++) {
    if (/\d/.test(next[pos])) seen++;
  }
  if (document.activeElement === el) el.setSelectionRange(pos, pos);
}

// ControlValueAccessor is Angular's bridge between a form control and a
// DOM element: writeValue pushes the control's value into the input, and
// onChange/onTouched report the person's edits back to the form.
abstract class FormattedInput implements ControlValueAccessor {
  protected readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  protected onChange: (value: unknown) => void = () => {};
  protected onTouched: () => void = () => {};

  abstract writeValue(value: unknown): void;
  registerOnChange(fn: (value: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.el.disabled = disabled; }
}

/** Shows commas while the form control holds a plain number (or null). */
@Directive({
  selector: 'input[appMoney]',
  host: { inputmode: 'numeric', autocomplete: 'off', '(input)': 'handleInput()', '(blur)': 'onTouched()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputDirective), multi: true }]
})
export class MoneyInputDirective extends FormattedInput {
  writeValue(value: number | null): void { this.el.value = formatMoney(value); }

  handleInput(): void {
    // Capped at 12 digits so huge pastes don't lose precision.
    const digits = this.el.value.replace(/\D/g, '').slice(0, 12);
    const value = digits ? Number(digits) : null;
    reformat(this.el, formatMoney(value));
    this.onChange(value);
  }
}

/** Formats a US phone number as it's typed. The control holds the formatted text. */
@Directive({
  selector: 'input[appPhone]',
  host: { type: 'tel', inputmode: 'tel', '(input)': 'handleInput()', '(blur)': 'onTouched()' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => PhoneInputDirective), multi: true }]
})
export class PhoneInputDirective extends FormattedInput {
  writeValue(value: string | null): void { this.el.value = formatPhoneInput(value); }

  handleInput(): void {
    const next = formatPhoneInput(this.el.value);
    reformat(this.el, next);
    this.onChange(next);
  }
}
