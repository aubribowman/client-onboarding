import { Routes } from '@angular/router';

// Lazy-loaded routes: each screen's code downloads only when it's visited.
export const routes: Routes = [
  {
    path: '',
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
  { path: '**', redirectTo: '' }
];
