import { Component, input } from '@angular/core';
import { statusLabels } from '../core/labels';
import { ApplicationStatus } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [attr.data-status]="status()">{{ labels[status()] }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-size: 0.8125rem;
      font-weight: 600;
      white-space: nowrap;
      background: var(--paper);
      color: var(--ink-muted);
      border: 1px solid var(--rule);
    }
    [data-status='InReview'] { color: var(--info); border-color: currentColor; }
    [data-status='NeedsInfo'] { color: var(--warn); border-color: currentColor; }
    [data-status='Approved'] { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
    [data-status='Declined'] { color: var(--error); border-color: currentColor; }
  `
})
export class StatusBadgeComponent {
  readonly status = input.required<ApplicationStatus>();
  readonly labels = statusLabels;
}
