import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { accountTypeLabels, entries, fundingMethodLabels } from '../../core/labels';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { MoneyInputDirective } from '../../shared/formatted-inputs';
import { OnboardingForm } from '../onboarding-form';

/** Step 4: account type, initial deposit, and funding method.
    The $1,000 minimum deposit is set in onboarding-form.ts. */
@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule, FieldErrorComponent, MoneyInputDirective],
  templateUrl: './account-step.component.html'
})
export class AccountStepComponent {
  readonly group = input.required<OnboardingForm['controls']['account']>();
  readonly accountTypes = entries(accountTypeLabels);
  readonly fundingMethods = entries(fundingMethodLabels);
}
