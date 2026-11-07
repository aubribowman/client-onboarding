import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { riskProfileDescriptions } from '../../core/labels';
import { RiskQuestion } from '../../core/models';
import { riskProfiles, scoreRisk } from '../../core/risk';
import { OnboardingForm } from '../onboarding-form';

@Component({
  selector: 'app-risk-step',
  imports: [ReactiveFormsModule],
  templateUrl: './risk-step.component.html',
  styleUrl: './risk-step.component.scss'
})
export class RiskStepComponent implements OnInit {
  readonly group = input.required<OnboardingForm['controls']['risk']>();
  readonly questions = input.required<RiskQuestion[]>();
  readonly showErrors = input(false);

  readonly profiles = riskProfiles;
  readonly descriptions = riskProfileDescriptions;
  private readonly destroyRef = inject(DestroyRef);

  // The form's answers, copied into a signal so the preview below
  // recalculates only when an answer changes.
  private readonly answers = signal<Record<string, number | null>>({});

  readonly result = computed(() => scoreRisk(this.questions().map(q => this.answers()[q.id] ?? null)));
  readonly answered = computed(() => this.questions().filter(q => this.answers()[q.id] != null).length);

  ngOnInit(): void {
    const group = this.group();
    group.valueChanges
      .pipe(startWith(group.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.answers.set(group.getRawValue()));
  }

  isMissing(questionId: string): boolean {
    return this.showErrors() && this.group().controls[questionId]?.invalid;
  }
}
