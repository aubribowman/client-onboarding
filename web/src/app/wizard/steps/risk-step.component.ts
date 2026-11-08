import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { riskProfileDescriptions } from '../../core/labels';
import { RiskQuestion } from '../../core/models';
import { riskProfiles, scoreRisk } from '../../core/risk';
import { OnboardingForm } from '../onboarding-form';

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 76;

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
  /** Answer values run 1 (cautious) to 4 (bold); each option shows that as bars. */
  readonly levels = [1, 2, 3, 4];
  private readonly destroyRef = inject(DestroyRef);

  // The form's answers, copied into a signal so the preview below
  // recalculates only when an answer changes.
  readonly answers = signal<Record<string, number | null>>({});

  readonly result = computed(() => scoreRisk(this.questions().map(q => this.answers()[q.id] ?? null)));
  readonly answered = computed(() => this.questions().filter(q => this.answers()[q.id] != null).length);
  readonly maxScore = computed(() => this.questions().length * 4);

  /** Ring fill: the score once every question is answered, otherwise progress through the questions. */
  readonly dash = computed(() => {
    const total = this.questions().length || 1;
    const r = this.result();
    const fraction = r ? r.score / this.maxScore() : this.answered() / total;
    const filled = Math.max(0.02, Math.min(1, fraction)) * GAUGE_CIRCUMFERENCE;
    return `${filled.toFixed(1)} ${GAUGE_CIRCUMFERENCE.toFixed(1)}`;
  });

  ngOnInit(): void {
    const group = this.group();
    group.valueChanges
      .pipe(startWith(group.getRawValue()), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.answers.set(group.getRawValue()));
  }

  isMissing(questionId: string): boolean {
    return this.showErrors() && this.group().controls[questionId]?.invalid;
  }

  /** True for profiles below the current one, so the scale reads as filled up to it. */
  isBelow(index: number): boolean {
    const r = this.result();
    return !!r && index < this.profiles.indexOf(r.profile);
  }
}
