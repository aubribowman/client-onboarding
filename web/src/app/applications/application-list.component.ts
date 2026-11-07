import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { accountTypeLabels, entries, statusLabels } from '../core/labels';
import { ApplicationStatus, ApplicationSummary } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { StatusBadgeComponent } from './status-badge.component';

type ListState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; items: ApplicationSummary[] };

@Component({
  selector: 'app-application-list',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadgeComponent],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.scss'
})
export class ApplicationListComponent {
  private readonly api = inject(OnboardingApiService);

  readonly statusOptions = entries(statusLabels);
  readonly accountTypeLabels = accountTypeLabels;
  readonly filter = signal<ApplicationStatus | null>(null);

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

  readonly rows = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.items : [];
  });

  setFilter(value: string): void {
    this.filter.set((value || null) as ApplicationStatus | null);
  }
}
