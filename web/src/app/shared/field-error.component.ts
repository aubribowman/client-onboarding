import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

// Shows one message for a control once the user has touched it.
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field-error" [id]="id()">{{ text }}</p>
    }
  `
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl | null>();
  readonly id = input<string>('');
  /** Used in the default required message: 'Enter {label}.' */
  readonly label = input<string>('');
  /** Overrides for specific error keys, e.g. { required: 'Enter a first name.' } */
  readonly messages = input<Record<string, string>>({});

  message(): string | null {
    const control = this.control();
    if (!control || !control.errors || !(control.touched || control.dirty)) return null;

    const [key, detail] = Object.entries(control.errors)[0];
    const custom = this.messages()[key];
    if (custom) return custom;

    switch (key) {
      case 'required': return this.label() ? `Enter ${this.label()}.` : 'This field is required.';
      case 'email': return 'Enter an email address like name@example.com.';
      case 'usPhone': return 'Enter a 10-digit US phone number.';
      case 'minimumAge': return `Account holders must be at least ${detail.requiredAge}.`;
      case 'min': return `Enter at least ${detail.min.toLocaleString()}.`;
      case 'max': return `Enter no more than ${detail.max.toLocaleString()}.`;
      case 'maxlength': return `Use ${detail.requiredLength} characters or fewer.`;
      case 'pattern': return 'Check the format of this field.';
      default: return 'Check this field.';
    }
  }
}
