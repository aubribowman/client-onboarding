import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { accountTypeLabels, employmentLabels, fundingMethodLabels } from '../../core/labels';
import { RiskQuestion } from '../../core/models';
import { scoreRisk } from '../../core/risk';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { OnboardingForm } from '../onboarding-form';

/** Step 5: a read-only summary of every answer, the terms checkbox, and
    any errors the API returned. Each section's "Edit" link emits the
    step index, and the wizard jumps there. */
@Component({
  selector: 'app-review-step',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, FieldErrorComponent],
  templateUrl: './review-step.component.html',
  styleUrl: './review-step.component.scss'
})
export class ReviewStepComponent {
  readonly form = input.required<OnboardingForm>();
  readonly questions = input.required<RiskQuestion[]>();
  readonly serverErrors = input<string[]>([]);
  readonly edit = output<number>();

  readonly accountTypeLabels = accountTypeLabels;
  readonly employmentLabels = employmentLabels;
  readonly fundingMethodLabels = fundingMethodLabels;

  value() {
    return this.form().getRawValue();
  }

  /** A preview of the score; the API calculates the stored one on submit. */
  risk() {
    const answers = this.value().risk;
    return scoreRisk(this.questions().map(q => answers[q.id] ?? null));
  }

  answerLabel(question: RiskQuestion): string {
    const v = this.value().risk[question.id];
    return question.options.find(o => o.value === v)?.label ?? 'Not answered';
  }
}
