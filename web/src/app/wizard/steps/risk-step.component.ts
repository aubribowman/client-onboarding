import { Component, DestroyRef, OnInit, computed, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs';
import { riskProfileDescriptions } from '../../core/labels';
import { RiskQuestion } from '../../core/models';
import { scoreRisk } from '../../core/risk';
import { OnboardingForm } from '../onboarding-form';

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 34;

/** Shows the questionnaire one question at a time. The wizard owns `index`
    so its footer buttons can move between questions. */
@Component({
  selector: 'app-risk-step',
  imports: [ReactiveFormsModule],
  templateUrl: './risk-step.component.html',
  styleUrl: './risk-step.component.scss',
  host: { '(document:keydown)': 'onKey($event)' }
})
export class RiskStepComponent implements OnInit {
  readonly group = input.required<OnboardingForm['controls']['risk']>();
  readonly questions = input.required<RiskQuestion[]>();
  readonly showErrors = input(false);
  readonly index = model(0);

  readonly descriptions = riskProfileDescriptions;
  /** Answer values run 1 (cautious) to 4 (bold); each option shows that as bars. */
  readonly levels = [1, 2, 3, 4];
  private readonly destroyRef = inject(DestroyRef);

  // The form's answers, copied into a signal so the summary recalculates
  // only when an answer changes.
  readonly answers = signal<Record<string, number | null>>({});

  readonly question = computed(() => this.questions()[this.index()]);
  /** The current question as a one-item list, for the keyed @for in the template. */
  readonly shown = computed(() => (this.question() ? [this.question()] : []));
  readonly result = computed(() => scoreRisk(this.questions().map(q => this.answers()[q.id] ?? null)));
  readonly answered = computed(() => this.questions().filter(q => this.answers()[q.id] != null).length);
  readonly maxScore = computed(() => this.questions().length * 4);

  /** Ring fill: the score once every question is answered, otherwise progress. */
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

  isMissing(): boolean {
    const q = this.question();
    return !!q && this.showErrors() && !!this.group().controls[q.id]?.invalid;
  }

  answerLabel(q: RiskQuestion): string | null {
    const value = this.answers()[q.id];
    return q.options.find(o => o.value === value)?.label ?? null;
  }

  /** Number keys 1–4 pick an answer, unless the person is typing somewhere. */
  onKey(event: KeyboardEvent): void {
    const target = event.target;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (target instanceof Element && target.matches('textarea, select, input:not([type=radio])')) return;
    const n = Number(event.key);
    const q = this.question();
    const option = q?.options[n - 1];
    if (!option || !Number.isInteger(n)) return;
    event.preventDefault();
    const control = this.group().controls[q.id];
    control.setValue(option.value);
    control.markAsTouched();
  }
}
