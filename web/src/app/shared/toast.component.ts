import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from './toast.service';

/** Renders ToastService's current notice at the bottom of the screen.
    The region is always present with aria-live, so screen readers announce
    each new message. Placed once in app.component.html. */
@Component({
  selector: 'app-toast',
  imports: [RouterLink],
  template: `
    <div class="region" role="status" aria-live="polite">
      @if (toasts.current(); as t) {
        <div class="toast" [attr.data-tone]="t.tone">
          @if (t.tone === 'success') {
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          }
          <span class="msg">{{ t.message }}</span>
          @if (t.link; as link) {
            <a [routerLink]="link.commands" (click)="toasts.dismiss()">{{ link.label }} →</a>
          }
          <button type="button" (click)="toasts.dismiss()" aria-label="Dismiss">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .region { position: fixed; z-index: 20; left: 50%; bottom: 1.5rem; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 2rem); }
    .toast {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 0.75rem 0.75rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--shell); color: var(--shell-ink);
      box-shadow: var(--shadow-pop);
      font-size: 0.875rem;
    }
    [data-tone='success'] svg { color: var(--shell-success); flex: none; }
    a { color: var(--accent-bright); font-weight: 600; white-space: nowrap; }
    button { border: 0; background: none; color: var(--shell-muted); font-size: 1.25rem; line-height: 1; padding: 0.25rem 0.5rem; cursor: pointer; }
    button:hover { color: var(--shell-ink); }
  `
})
export class ToastComponent {
  readonly toasts = inject(ToastService);
}
