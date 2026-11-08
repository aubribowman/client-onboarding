import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

// App-wide providers. Services marked providedIn: 'root' don't need
// to be listed here.
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding lets route params arrive as component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch())
  ]
};
