import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  tone: 'success' | 'neutral';
  link?: { label: string; commands: unknown[] };
}

/** One short notice at a time, shown by the app shell. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<Toast | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(toast: Toast, ms = 7000): void {
    clearTimeout(this.timer);
    this.current.set(toast);
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
  }
}
