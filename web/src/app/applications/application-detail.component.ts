import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  accountTypeLabels,
  employmentLabels,
  formatPhone,
  fundingMethodLabels,
  riskProfileDescriptions,
  statusActions,
  statusLabels
} from '../core/labels';
import { ApplicationStatus, ClientApplication, ValidationProblem } from '../core/models';
import { OnboardingApiService } from '../core/onboarding-api.service';
import { StatusBadgeComponent } from './status-badge.component';

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

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    // Two independent requests, fired together, handled once both return.
    forkJoin({
      application: this.api.get(this.id()),
      next: this.api.nextStatuses(this.id())
    }).subscribe({
      next: ({ application, next }) => {
        this.application.set(application);
        this.nextStatuses.set(next);
      },
      error: () => this.loadError.set(true)
    });
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
