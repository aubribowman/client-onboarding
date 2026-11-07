import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { employmentLabels, entries } from '../../core/labels';
import { EmploymentStatus } from '../../core/models';
import { FieldErrorComponent } from '../../shared/field-error.component';
import { OnboardingForm } from '../onboarding-form';

const needsEmployer: EmploymentStatus[] = ['Employed', 'SelfEmployed'];

@Component({
  selector: 'app-financial-step',
  imports: [ReactiveFormsModule, FieldErrorComponent],
  templateUrl: './financial-step.component.html'
})
export class FinancialStepComponent implements OnInit {
  readonly group = input.required<OnboardingForm['controls']['financial']>();
  readonly employmentOptions = entries(employmentLabels);
  private readonly destroyRef = inject(DestroyRef);

  showEmployer = true;

  // Employer is only required for people who have one. Validators are
  // swapped as the status changes, rather than checked at submit time.
  ngOnInit(): void {
    const { employmentStatus, employer } = this.group().controls;
    employmentStatus.valueChanges
      .pipe(startWith(employmentStatus.value), takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.showEmployer = needsEmployer.includes(status);
        employer.setValidators(this.showEmployer ? [Validators.required, Validators.maxLength(100)] : null);
        employer.updateValueAndValidity({ emitEvent: false });
      });
  }
}
