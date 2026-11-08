import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { ApplicationStatus, ApplicationSummary } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { daysWaiting, openStatuses, waitingTone } from '../core/queue';
import { StatusBadgeComponent } from '../applications/status-badge.component';
import { readDraftSummary } from '../wizard/draft';

type Load = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; items: ApplicationSummary[] };

/** The landing page (route /): a greeting, two action cards (start or
    continue an application, open the queue), and the five open
    applications that most need attention. */
@Component({
  selector: 'app-home',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly api = inject(OnboardingApiService);

  readonly today = new Date();
  readonly greeting = this.today.getHours() < 12 ? 'Good morning' : this.today.getHours() < 18 ? 'Good afternoon' : 'Good evening';
  /** An unfinished application saved by the wizard, if any. Turns "Start" into "Continue". */
  readonly draft = readDraftSummary();

  readonly queue = toSignal(
    this.api.list(null).pipe(
      map(items => ({ kind: 'ready', items }) as Load),
      startWith({ kind: 'loading' } as Load),
      catchError(() => of({ kind: 'error' } as Load))
    ),
    { initialValue: { kind: 'loading' } as Load }
  );

  private readonly items = computed(() => {
    const q = this.queue();
    return q.kind === 'ready' ? q.items : [];
  });

  readonly counts = computed(() => {
    const c: Record<ApplicationStatus, number> = { Submitted: 0, InReview: 0, NeedsInfo: 0, Approved: 0, Declined: 0 };
    for (const a of this.items()) c[a.status]++;
    return c;
  });

  /** NeedsInfo is left out: those are waiting on the client, not the reviewer. */
  readonly needsDecision = computed(() => this.counts().Submitted + this.counts().InReview);

  /** Open applications, longest wait first. Ones waiting on the client go last. */
  readonly attention = computed(() =>
    this.items()
      .filter(a => openStatuses.includes(a.status))
      .map(a => {
        const waiting = daysWaiting(a);
        return { ...a, waiting, tone: waitingTone(waiting) };
      })
      .sort((a, b) =>
        Number(a.status === 'NeedsInfo') - Number(b.status === 'NeedsInfo') ||
        (b.waiting ?? 0) - (a.waiting ?? 0) ||
        a.submittedAt.localeCompare(b.submittedAt)
      )
      .slice(0, 5)
  );

  /** Applications needing a decision that have waited four days or more. */
  readonly overdue = computed(
    () => this.items().filter(a => a.status !== 'NeedsInfo' && waitingTone(daysWaiting(a)) === 'late').length
  );
}
