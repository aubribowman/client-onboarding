import { TestBed } from '@angular/core/testing';
import { THEME_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  afterEach(() => {
    localStorage.removeItem(THEME_KEY);
    root.removeAttribute('data-theme');
  });

  it('follows the system when nothing is saved', () => {
    const service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    expect(service.theme()).toBe('system');
    expect(root.hasAttribute('data-theme')).toBeFalse();
  });

  it('applies and saves a chosen theme', () => {
    const service = TestBed.inject(ThemeService);
    service.theme.set('dark');
    TestBed.flushEffects();
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('forgets the choice when switched back to System', () => {
    localStorage.setItem(THEME_KEY, 'light');
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('light');
    service.theme.set('system');
    TestBed.flushEffects();
    expect(root.hasAttribute('data-theme')).toBeFalse();
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });
});
