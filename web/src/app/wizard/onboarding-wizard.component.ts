import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs';
import { RiskQuestion, ValidationProblem } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { DRAFT_KEY } from './draft';
import { createOnboardingForm, toRequest } from './onboarding-form';
import { AccountStepComponent } from './steps/account-step.component';
import { FinancialStepComponent } from './steps/financial-step.component';
import { PersonalStepComponent } from './steps/personal-step.component';
import { ReviewStepComponent } from './steps/review-step.component';
import { RiskStepComponent } from './steps/risk-step.component';

// Index of the risk questionnaire in `steps`. That step has its own
// inner navigation (one question at a time), so several methods below
// treat it specially.
const RISK_STEP = 2;

interface Step {
  title: string;
  description: string;
}

/** The five-step "New application" wizard (route /new).
    This component owns the form, the current step, draft saving, and
    submitting. Each step component only renders its own part of the form.
    Flow: load risk questions -> restore any saved draft -> autosave while
    the person works -> submit -> go to the new application's detail page. */
@Component({
  selector: 'app-onboarding-wizard',
  imports: [
    ReactiveFormsModule,
    PersonalStepComponent,
    FinancialStepComponent,
    RiskStepComponent,
    AccountStepComponent,
    ReviewStepComponent
  ],
  templateUrl: './onboarding-wizard.component.html',
  styleUrl: './onboarding-wizard.component.scss'
})
export class OnboardingWizardComponent implements OnInit {
  private readonly api = inject(OnboardingApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = createOnboardingForm(inject(FormBuilder));

  readonly steps: Step[] = [
    { title: 'Client details', description: 'Legal name and contact information, as they appear on a government ID.' },
    { title: 'Employment and finances', description: 'Used to check that the account suits the client’s situation.' },
    { title: 'Risk questionnaire', description: 'Five questions that set the client’s risk profile.' },
    { title: 'Account setup', description: 'Choose the account and how it will be funded.' },
    { title: 'Review and submit', description: 'Check everything before sending the application for review.' }
  ];

  /** The step on screen (index into `steps`). */
  readonly current = signal(0);
  /** The furthest step reached. The stepper only lets people jump back to steps up to here. */
  readonly furthest = signal(0);
  readonly isLast = computed(() => this.current() === this.steps.length - 1);

  /** Which risk question is showing. Next and Back walk through these first. */
  readonly riskIndex = signal(0);
  readonly onEarlierQuestion = computed(
    () => this.current() === RISK_STEP && this.riskIndex() < this.questions().length - 1
  );

  /** Risk questions come from the API, so the questionnaire can change without a front-end release. */
  readonly questions = signal<RiskQuestion[]>([]);
  readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  /** True after a failed Next, so the current step shows its errors. */
  readonly attempted = signal(false);
  readonly submitting = signal(false);
  /** Validation messages the API sent back on submit. */
  readonly serverErrors = signal<string[]>([]);
  /** Drives the "Picked up where you left off" / "Draft saved" note in the header. */
  readonly restoredDraft = signal(false);
  readonly draftSavedAt = signal<Date | null>(null);

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loadState.set('loading');
    this.api.getRiskQuestions().subscribe({
      next: questions => {
        // One control per question. They have to exist before a saved
        // draft is patched in, or patchValue silently skips them.
        for (const q of questions) {
          this.form.controls.risk.addControl(q.id, new FormControl<number | null>(null, Validators.required));
        }
        this.questions.set(questions);
        this.restoreDraft();
        this.startAutosave();
        this.loadState.set('ready');
      },
      error: () => this.loadState.set('error')
    });
  }

  /** The part of the form each step is responsible for. Keep in step order. */
  private stepControl(index: number): AbstractControl {
    const c = this.form.controls;
    return [c.personal, c.financial, c.risk, c.account, c.acceptedTerms][index];
  }

  /** A step shows as complete once it's been reached and its fields are valid. */
  stepDone(index: number): boolean {
    return this.stepControl(index).valid;
  }

  /** The primary button. On the risk step it first walks through the questions;
      otherwise it validates the current step before moving on. */
  next(): void {
    if (this.onEarlierQuestion()) {
      const id = this.questions()[this.riskIndex()].id;
      const answer = this.form.controls.risk.controls[id];
      if (answer.invalid) {
        answer.markAsTouched();
        this.attempted.set(true);
        return;
      }
      this.attempted.set(false);
      this.riskIndex.update(i => i + 1);
      return;
    }

    const control = this.stepControl(this.current());
    if (control.invalid) {
      control.markAllAsTouched();
      this.attempted.set(true);
      if (this.current() === RISK_STEP) this.showFirstUnanswered();
      return;
    }
    this.attempted.set(false);
    this.current.update(i => i + 1);
    this.furthest.update(f => Math.max(f, this.current()));
    window.scrollTo({ top: 0 });
  }

  back(): void {
    this.attempted.set(false);
    if (this.current() === RISK_STEP && this.riskIndex() > 0) {
      this.riskIndex.update(i => i - 1);
      return;
    }
    this.current.update(i => Math.max(0, i - 1));
    // Coming back into the questionnaire lands on its last question.
    if (this.current() === RISK_STEP) this.riskIndex.set(this.questions().length - 1);
  }

  /** Jump from the stepper or a review-page "Edit" link. Steps not yet reached are locked. */
  goTo(index: number): void {
    if (index > this.furthest()) return;
    this.attempted.set(false);
    this.current.set(index);
    if (index === RISK_STEP) this.showFirstUnanswered();
  }

  private showFirstUnanswered(): void {
    const risk = this.form.controls.risk.controls;
    const i = this.questions().findIndex(q => risk[q.id]?.invalid);
    this.riskIndex.set(i === -1 ? 0 : i);
  }

  submit(): void {
    // Safety net: if anything is still invalid, send the person to the first
    // step with a problem instead of submitting.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.steps.findIndex((_, i) => this.stepControl(i).invalid);
      this.attempted.set(true);
      this.current.set(firstInvalid);
      if (firstInvalid === RISK_STEP) this.showFirstUnanswered();
      return;
    }

    this.submitting.set(true);
    this.serverErrors.set([]);

    this.api.submit(toRequest(this.form.getRawValue())).subscribe({
      next: application => {
        localStorage.removeItem(DRAFT_KEY);
        // `submitted` tells the detail page to show its confirmation banner.
        this.router.navigate(['/applications', application.id], { state: { submitted: true } });
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        // A 400 carries field errors from the API's validation; anything
        // else (no response, 500) gets a generic message.
        const problem = err.error as ValidationProblem | null;
        this.serverErrors.set(
          problem?.errors
            ? Object.values(problem.errors).flat()
            : ['The server couldn’t be reached. Check that the API is running, then submit again.']
        );
      }
    });
  }

  startOver(): void {
    this.form.reset();
    localStorage.removeItem(DRAFT_KEY);
    this.current.set(0);
    this.furthest.set(0);
    this.riskIndex.set(0);
    this.restoredDraft.set(false);
    this.draftSavedAt.set(null);
    this.serverErrors.set([]);
  }

  // Save progress locally so a refresh doesn't lose a half-finished application.
  // debounceTime keeps this from writing on every keystroke.
  private startAutosave(): void {
    this.form.valueChanges
      .pipe(debounceTime(600), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveDraft());
  }

  private saveDraft(): void {
    // Terms acceptance is left out on purpose: the person should agree
    // again in the session where they actually submit.
    const { acceptedTerms, ...draft } = this.form.getRawValue();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, furthest: this.furthest() }));
      this.draftSavedAt.set(new Date());
    } catch {
      // Storage can be full or disabled; the form still works without it.
    }
  }

  /** Saves right away (autosave waits for a pause in typing), then goes home,
      where the draft can be picked up again. */
  saveAndExit(): void {
    if (this.form.dirty || this.draftSavedAt() || this.restoredDraft()) this.saveDraft();
    this.router.navigate(['/']);
  }

  /** Loads a saved draft, if there is one. A corrupt draft is thrown away. */
  private restoreDraft(): void {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const { draft, furthest } = JSON.parse(saved);
      this.form.patchValue(draft);
      this.furthest.set(furthest ?? 0);
      this.restoredDraft.set(true);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }
}
