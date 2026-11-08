import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import {
  accountTypeLabels,
  employmentLabels,
  formatPhone,
  fundingMethodLabels,
  riskProfileDescriptions,
  statusActions,
  statusLabels
} from '../core/labels';
import { ApplicationStatus, ClientApplication, RiskQuestion, ValidationProblem } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { openStatuses } from '../core/queue';
import { reviewFlags } from '../core/review-flags';
import { ToastService } from '../shared/toast.service';
import { StatusBadgeComponent } from './status-badge.component';

// The risk gauge is an SVG circle with r=44; see .gauge in styles.scss.
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 44;

/** Choices in the Decline dialog. The pick is saved at the start of the history note. */
export const declineReasons = [
  'Couldn’t verify identity',
  'Risk profile doesn’t suit the account',
  'Missing or inconsistent information',
  'Other'
];

type Tab = 'overview' | 'risk' | 'history';

type StageTone = 'done' | 'info' | 'warn' | 'success' | 'error' | 'upcoming';

/** One application (route /applications/:id). The left side shows the
    client's details in tabs; the right side is the reviewer's decision card
    with one button per status the API allows next. After a decision, a toast
    offers the next application in the queue. */
@Component({
  selector: 'app-application-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, StatusBadgeComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss'
})
export class ApplicationDetailComponent {
  private readonly api = inject(OnboardingApiService);
  private readonly toasts = inject(ToastService);
  private readonly declineDialog = viewChild<ElementRef<HTMLDialogElement>>('declineDialog');

  /** Bound from the :id route parameter (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly application = signal<ClientApplication | null>(null);
  readonly nextStatuses = signal<ApplicationStatus[]>([]);
  readonly questions = signal<RiskQuestion[]>([]);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly saving = signal(false);
  /** True when the wizard just sent us here; shows a "Submitted" banner. */
  readonly justSubmitted = signal(!!history.state?.submitted);
  // Plain fields (not signals) because they're bound with ngModel.
  note = '';
  declineReason = declineReasons[0];
  readonly declineReasons = declineReasons;
  readonly formatPhone = formatPhone;

  readonly tab = signal<Tab>('overview');
  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'risk', label: 'Risk answers' },
    { id: 'history', label: 'History' }
  ];

  readonly flags = computed(() => {
    const app = this.application();
    return app ? reviewFlags(app) : [];
  });

  /** Newest first for the History tab. slice() so the original isn't reversed in place. */
  readonly history = computed(() => this.application()?.history.slice().reverse() ?? []);

  readonly labels = {
    account: accountTypeLabels,
    employment: employmentLabels,
    funding: fundingMethodLabels,
    status: statusLabels,
    action: statusActions,
    risk: riskProfileDescriptions
  };

  // Falls back to 5 questions if the questionnaire didn't load.
  readonly maxScore = computed(() => (this.questions().length || 5) * 4);

  readonly dash = computed(() => {
    const app = this.application();
    const fraction = app ? Math.max(0.02, Math.min(1, app.riskScore / this.maxScore())) : 0;
    return `${(fraction * GAUGE_CIRCUMFERENCE).toFixed(1)} ${GAUGE_CIRCUMFERENCE.toFixed(1)}`;
  });

  /** Each question with the label of the answer the client picked. */
  readonly answers = computed(() => {
    const app = this.application();
    if (!app) return [];
    return this.questions().map(q => {
      const value = app.riskAnswers.find(a => a.questionId === q.id)?.value;
      return { question: q.text, answer: q.options.find(o => o.value === value)?.label ?? '—' };
    });
  });

  /** Three-stage tracker: Submitted, then review, then the decision. */
  readonly stages = computed(() => {
    const status = this.application()?.status;
    const review: { label: string; tone: StageTone } =
      status === 'Submitted' ? { label: 'In review', tone: 'upcoming' }
      : status === 'NeedsInfo' ? { label: 'Needs info', tone: 'warn' }
      : status === 'InReview' ? { label: 'In review', tone: 'info' }
      : { label: 'In review', tone: 'done' };
    const decision: { label: string; tone: StageTone } =
      status === 'Approved' ? { label: 'Approved', tone: 'success' }
      : status === 'Declined' ? { label: 'Declined', tone: 'error' }
      : { label: 'Decision', tone: 'upcoming' };
    return [{ label: 'Submitted', tone: 'done' as StageTone }, review, decision];
  });

  constructor() {
    // "Next in queue" reuses this component with a new id, so reload on every change.
    // Only id() is tracked; untracked() keeps the signals written below
    // from re-triggering this effect.
    effect(() => {
      this.id();
      untracked(() => {
        this.application.set(null);
        this.loadError.set(false);
        this.actionError.set(null);
        this.tab.set('overview');
        this.load();
      });
    });
  }

  load(): void {
    // Independent requests, fired together, handled once all return. The
    // questions only supply answer labels, so the page still loads without them.
    forkJoin({
      application: this.api.get(this.id()),
      next: this.api.nextStatuses(this.id()),
      questions: this.api.getRiskQuestions().pipe(catchError(() => of([] as RiskQuestion[])))
    }).subscribe({
      next: ({ application, next, questions }) => {
        this.application.set(application);
        this.nextStatuses.set(next);
        this.questions.set(questions);
      },
      error: () => this.loadError.set(true)
    });
  }

  initials(app: ClientApplication): string {
    return (app.personal.firstName[0] + app.personal.lastName[0]).toUpperCase();
  }

  /** Arrow keys move between tabs, as the ARIA tabs pattern expects. */
  onTabKey(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const i = this.tabs.findIndex(t => t.id === this.tab());
    const next = this.tabs[(i + step + this.tabs.length) % this.tabs.length];
    this.tab.set(next.id);
    document.getElementById('tab-' + next.id)?.focus();
  }

  /** A decision button was pressed. Decline asks for a reason first, and
      Request info needs a note so the client knows what to send. */
  decide(status: ApplicationStatus): void {
    this.actionError.set(null);
    if (status === 'Declined') {
      this.declineDialog()?.nativeElement.showModal();
      return;
    }
    if (status === 'NeedsInfo' && !this.note.trim()) {
      this.actionError.set('Add a note that tells the client what’s needed.');
      document.getElementById('decision-note')?.focus();
      return;
    }
    this.changeStatus(status, this.note.trim() || null);
  }

  confirmDecline(): void {
    this.declineDialog()?.nativeElement.close();
    const extra = this.note.trim();
    this.changeStatus('Declined', `Reason: ${this.declineReason}.${extra ? ' ' + extra : ''}`);
  }

  cancelDecline(): void {
    this.declineDialog()?.nativeElement.close();
  }

  /** Sends the decision, then reloads so the status, history and buttons update. */
  private changeStatus(status: ApplicationStatus, note: string | null): void {
    this.saving.set(true);
    this.api.changeStatus(this.id(), status, note).subscribe({
      next: () => {
        this.note = '';
        this.saving.set(false);
        this.justSubmitted.set(false);
        this.load();
        this.announce(status);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const problem = err.error as ValidationProblem | null;
        this.actionError.set(
          problem?.errors ? Object.values(problem.errors).flat().join(' ') : problem?.detail ?? 'The status didn’t change. Try again.'
        );
      }
    });
  }

  /** Confirms the change, and offers the oldest open application still waiting. */
  private announce(status: ApplicationStatus): void {
    const name = this.application()?.personal.firstName ?? 'The client';
    const message =
      status === 'Approved' ? `${name}’s application was approved.`
      : status === 'Declined' ? `${name}’s application was declined.`
      : status === 'NeedsInfo' ? `Info requested from ${name}.`
      : `Review started for ${name}.`;
    // "Start review" means the reviewer is staying on this application,
    // so only finished decisions offer the next one. Applications waiting
    // on the client (NeedsInfo) are skipped.
    const done = status !== 'InReview';
    this.api.list(null).pipe(catchError(() => of([]))).subscribe(items => {
      const next = items
        .filter(a => a.id !== this.id() && openStatuses.includes(a.status) && a.status !== 'NeedsInfo')
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];
      this.toasts.show({
        message,
        tone: 'success',
        link: done && next ? { label: 'Next in queue', commands: ['/applications', next.id] } : undefined
      });
    });
  }
}
