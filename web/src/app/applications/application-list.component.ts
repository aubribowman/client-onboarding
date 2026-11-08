import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { accountTypeLabels, entries, statusLabels } from '../core/labels';
import { ApplicationStatus, ApplicationSummary, RiskProfile } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { daysWaiting, openStatuses, waitingTone } from '../core/queue';
import { riskProfiles } from '../core/risk';
import { StatusBadgeComponent } from './status-badge.component';

type ListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; items: ApplicationSummary[] };

/** "Open" is every status that still needs action. */
type Filter = 'Open' | 'All' | ApplicationStatus;
type SortKey = 'submitted' | 'deposit' | 'waiting';

/** A table row: the API summary plus the "Waiting" column, worked out here. */
interface Row extends ApplicationSummary {
  waiting: number | null;
  tone: ReturnType<typeof waitingTone>;
}

/** The review queue (route /applications): status filter chips, a search
    box, a sortable table, and a summary strip. Rows link to the detail page. */
@Component({
  selector: 'app-application-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss'
})
export class ApplicationListComponent {
  private readonly api = inject(OnboardingApiService);

  readonly accountTypeLabels = accountTypeLabels;
  readonly filter = signal<Filter>('Open');
  readonly query = signal('');
  readonly sort = signal<{ key: SortKey; desc: boolean }>({ key: 'submitted', desc: true });
  /** Bars in the small risk meter (Conservative = 1 ... Aggressive = 4). */
  readonly levels = [1, 2, 3, 4];
  /** Placeholder rows shown while the list loads. */
  readonly skeletonRows = [1, 2, 3, 4, 5];

  // A single status is filtered by the API. "Open" and "All" fetch
  // everything and narrow it here. switchMap cancels the request still
  // in flight so a slow response can't overwrite a newer one.
  readonly state = toSignal(
    toObservable(this.filter).pipe(
      switchMap(filter =>
        this.api.list(filter === 'Open' || filter === 'All' ? null : filter).pipe(
          map(items => ({ kind: 'ready', items }) as ListState),
          startWith({ kind: 'loading' } as ListState),
          catchError(() => of({ kind: 'error' } as ListState))
        )
      )
    ),
    { initialValue: { kind: 'loading' } as ListState }
  );

  // The whole queue, fetched once, for the summary and chip counts.
  private readonly all = toSignal(this.api.list(null).pipe(catchError(() => of(null))), { initialValue: null });

  readonly counts = computed(() => {
    const counts: Record<ApplicationStatus, number> = { Submitted: 0, InReview: 0, NeedsInfo: 0, Approved: 0, Declined: 0 };
    for (const app of this.all() ?? []) counts[app.status]++;
    return counts;
  });

  readonly total = computed(() => this.all()?.length ?? null);

  /** Open items late enough to show red (four days or more, set in core/queue.ts). */
  readonly overdue = computed(() => (this.all() ?? []).filter(a => waitingTone(daysWaiting(a)) === 'late').length);

  readonly chips = computed(() => {
    const known = this.all() !== null;
    const c = this.counts();
    return [
      { value: 'Open' as Filter, label: 'Open', count: known ? c.Submitted + c.InReview + c.NeedsInfo : null },
      ...entries(statusLabels).map(o => ({ value: o.value as Filter, label: o.label, count: known ? c[o.value] : null })),
      { value: 'All' as Filter, label: 'All', count: this.total() }
    ];
  });

  /** The current results, narrowed by "Open" and the search box, then sorted. */
  readonly rows = computed<Row[]>(() => {
    const state = this.state();
    if (state.kind !== 'ready') return [];
    const q = this.query().trim().toLowerCase();
    const now = new Date();
    const rows = state.items
      .filter(a => this.filter() !== 'Open' || openStatuses.includes(a.status))
      .filter(a => !q || a.clientName.toLowerCase().includes(q) || a.referenceNumber.toLowerCase().includes(q))
      .map(a => {
        const waiting = daysWaiting(a, now);
        return { ...a, waiting, tone: waitingTone(waiting) };
      });

    const { key, desc } = this.sort();
    const value = (r: Row): number =>
      key === 'deposit' ? r.initialDeposit : key === 'waiting' ? (r.waiting ?? -1) : new Date(r.submittedAt).getTime();
    return rows.sort((a, b) => (desc ? value(b) - value(a) : value(a) - value(b)));
  });

  /** Clicking the active column flips the direction; a new column starts descending. */
  sortBy(key: SortKey): void {
    this.sort.update(s => (s.key === key ? { key, desc: !s.desc } : { key, desc: true }));
  }

  /** Value for the column header's aria-sort, so screen readers announce the sort. */
  ariaSort(key: SortKey): 'ascending' | 'descending' | null {
    const s = this.sort();
    return s.key === key ? (s.desc ? 'descending' : 'ascending') : null;
  }

  /** "Maya Okafor" -> "MO", for the avatar circle. */
  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  riskLevel(profile: RiskProfile): number {
    return riskProfiles.indexOf(profile) + 1;
  }
}
