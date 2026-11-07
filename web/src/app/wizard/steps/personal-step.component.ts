import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { OnboardingForm } from '../onboarding-form';

@Component({
  selector: 'app-personal-step',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './personal-step.component.html'
})
export class PersonalStepComponent {
  readonly group = input.required<OnboardingForm['controls']['personal']>();
}
