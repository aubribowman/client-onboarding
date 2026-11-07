import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { accountTypeLabels, entries, fundingMethodLabels } from '../../core/labels';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { OnboardingForm } from '../onboarding-form';

@Component({
  selector: 'app-account-step',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './account-step.component.html'
})
export class AccountStepComponent {
  readonly group = input.required<OnboardingForm['controls']['account']>();
  readonly accountTypes = entries(accountTypeLabels);
  readonly fundingMethods = entries(fundingMethodLabels);
}
