import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'system' | 'light' | 'dark';

export const THEME_KEY = 'theme';

/** Light, Dark, or follow the device. The choice is saved on this device.
    index.html applies a saved choice before Angular starts. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly theme = signal<Theme>(readSaved());

  constructor() {
    // Runs on start and whenever the signal changes. styles.scss swaps
    // the color tokens based on the data-theme attribute.
    effect(() => {
      const theme = this.theme();
      if (theme === 'system') this.root.removeAttribute('data-theme');
      else this.root.setAttribute('data-theme', theme);
      try {
        if (theme === 'system') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Storage can be disabled; the theme still applies for this visit.
      }
    });
  }
}

function readSaved(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}
