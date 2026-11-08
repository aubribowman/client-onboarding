import { Component, inject } from '@angular/core';
import { Theme, ThemeService } from '../core/theme.service';

/** Light / Dark / System, as a row of three radio buttons shown as icons.
    Real (visually hidden) radios give keyboard and screen reader support for
    free; the labels are styled as a segmented control. State lives in ThemeService. */
@Component({
  selector: 'app-theme-switch',
  template: `
    <fieldset>
      <legend class="visually-hidden">Theme</legend>
      @for (option of options; track option.value) {
        <label [title]="option.label">
          <input type="radio" name="theme" class="visually-hidden" [value]="option.value"
                 [checked]="themes.theme() === option.value" (change)="themes.theme.set(option.value)" />
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            @switch (option.value) {
              @case ('light') { <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/> }
              @case ('dark') { <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/> }
              @default { <rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/> }
            }
          </svg>
          <span class="text">{{ option.label }}</span>
        </label>
      }
    </fieldset>
  `,
  styles: `
    fieldset {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
      margin: 0;
      padding: 3px;
      border: 1px solid var(--rule);
      border-radius: var(--radius-sm);
      background: var(--surface-sunk);
    }
    label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem;
      min-height: 2rem;
      padding: 0 0.25rem;
      border-radius: 6px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--ink-muted);
      cursor: pointer;
      &:hover { color: var(--ink); }
      &:has(input:checked) { background: var(--surface); color: var(--ink); box-shadow: 0 0 0 1px var(--rule); }
      &:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 1px; }
    }
    /* The phone and tablet top bar has room for icons only. */
    @media (max-width: 900px) {
      label { padding: 0 0.625rem; }
      .text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    }
  `
})
export class ThemeSwitchComponent {
  readonly themes = inject(ThemeService);
  readonly options: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' }
  ];
}
