import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { accountTypeLabels, entries, statusLabels } from '../core/labels';
import { ApplicationStatus, ApplicationSummary, RiskProfile } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { riskProfiles } from '../core/risk';
import { StatusBadgeComponent } from './status-badge.component';

type ListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; items: ApplicationSummary[] };

const AVATAR_COLORS = ['#0a1a3a', '#1f4fd8', '#6b3fd4', '#0f766e', '#a15c00'];

@Component({
  selector: 'app-application-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss'
})
export class ApplicationListComponent {
  private readonly api = inject(OnboardingApiService);

  readonly accountTypeLabels = accountTypeLabels;
  readonly filter = signal<ApplicationStatus | null>(null);
  readonly query = signal('');
  readonly levels = [1, 2, 3, 4];

  // Each filter change starts a new request; switchMap cancels the one
  // still in flight so a slow response can't overwrite a newer one.
  readonly state = toSignal(
    toObservable(this.filter).pipe(
      switchMap(status =>
        this.api.list(status).pipe(
          map(items => ({ kind: 'ready', items }) as ListState),
          startWith({ kind: 'loading' } as ListState),
          catchError(() => of({ kind: 'error' } as ListState))
        )
      )
    ),
    { initialValue: { kind: 'loading' } as ListState }
  );

  // The whole queue, fetched once, for the summary tiles and tab counts.
  private readonly all = toSignal(this.api.list(null).pipe(catchError(() => of(null))), { initialValue: null });

  readonly counts = computed(() => {
    const counts: Record<ApplicationStatus, number> = { Submitted: 0, InReview: 0, NeedsInfo: 0, Approved: 0, Declined: 0 };
    for (const app of this.all() ?? []) counts[app.status]++;
    return counts;
  });

  readonly total = computed(() => this.all()?.length ?? null);

  readonly tabs = computed(() => [
    { value: null, label: 'All', count: this.total() },
    ...entries(statusLabels).map(o => ({ value: o.value as ApplicationStatus | null, label: o.label, count: this.all() ? this.counts()[o.value] : null }))
  ]);

  /** The current filter's results, narrowed by the search box. */
  readonly rows = computed(() => {
    const state = this.state();
    if (state.kind !== 'ready') return [];
    const q = this.query().trim().toLowerCase();
    return q
      ? state.items.filter(a => a.clientName.toLowerCase().includes(q) || a.referenceNumber.toLowerCase().includes(q))
      : state.items;
  });

  setFilter(value: ApplicationStatus | null): void {
    this.filter.set(value);
  }

  initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }

  avatarColor(name: string): string {
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  riskLevel(profile: RiskProfile): number {
    return riskProfiles.indexOf(profile) + 1;
  }
}
