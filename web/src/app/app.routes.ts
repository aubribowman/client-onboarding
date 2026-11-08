import { Routes } from '@angular/router';

// Lazy-loaded routes: each screen's code downloads only when it's visited.
// `title` sets the browser tab title. The detail page receives `:id` as a
// component input (see withComponentInputBinding in app.config.ts).
export const routes: Routes = [
  {
    path: '',
    title: 'Home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'new',
    title: 'New application',
    loadComponent: () => import('./wizard/onboarding-wizard.component').then(m => m.OnboardingWizardComponent)
  },
  {
    path: 'applications',
    title: 'Review queue',
    loadComponent: () => import('./applications/application-list.component').then(m => m.ApplicationListComponent)
  },
  {
    path: 'applications/:id',
    title: 'Application',
    loadComponent: () => import('./applications/application-detail.component').then(m => m.ApplicationDetailComponent)
  },
  // Unknown URLs go back to the home page.
  { path: '**', redirectTo: '' }
];
