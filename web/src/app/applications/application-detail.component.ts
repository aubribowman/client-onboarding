import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
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
import { StatusBadgeComponent } from './status-badge.component';

const GAUGE_CIRCUMFERENCE = 2 * Math.PI * 56;

type StageTone = 'done' | 'info' | 'warn' | 'success' | 'error' | 'upcoming';

@Component({
  selector: 'app-application-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule, StatusBadgeComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss'
})
export class ApplicationDetailComponent implements OnInit {
  private readonly api = inject(OnboardingApiService);

  /** Bound from the :id route parameter (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly application = signal<ClientApplication | null>(null);
  readonly nextStatuses = signal<ApplicationStatus[]>([]);
  readonly questions = signal<RiskQuestion[]>([]);
  readonly loadError = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly justSubmitted = signal(!!history.state?.submitted);
  note = '';
  readonly formatPhone = formatPhone;

  readonly labels = {
    account: accountTypeLabels,
    employment: employmentLabels,
    funding: fundingMethodLabels,
    status: statusLabels,
    action: statusActions,
    risk: riskProfileDescriptions
  };

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

  ngOnInit(): void {
    this.load();
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

  changeStatus(status: ApplicationStatus): void {
    this.saving.set(true);
    this.actionError.set(null);
    this.api.changeStatus(this.id(), status, this.note.trim() || null).subscribe({
      next: () => {
        this.note = '';
        this.saving.set(false);
        this.justSubmitted.set(false);
        this.load();
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
}
