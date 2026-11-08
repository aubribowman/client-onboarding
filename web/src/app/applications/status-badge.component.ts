import { Component, input } from '@angular/core';
import { statusLabels } from '../core/labels';
import { ApplicationStatus } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-status]="status()"><span class="dot" aria-hidden="true"></span>{{ labels[status()] }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
      padding: 0.1875rem 0.5625rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
      background: var(--neutral-wash);
      color: var(--ink);
    }
    .dot { width: 0.4375rem; height: 0.4375rem; border-radius: 50%; background: var(--neutral-dot); }
    [data-status='InReview'] { background: var(--info-wash); color: var(--info); .dot { background: var(--info-dot); } }
    [data-status='NeedsInfo'] { background: var(--warn-wash); color: var(--warn); .dot { background: var(--warn-dot); } }
    [data-status='Approved'] { background: var(--success-wash); color: var(--success); .dot { background: var(--success-dot); } }
    [data-status='Declined'] { background: var(--error-wash); color: var(--error); .dot { background: var(--error-dot); } }
  `
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus>();
  readonly labels = statusLabels;
}
