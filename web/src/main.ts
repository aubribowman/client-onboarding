// Entry point. Starts the Angular app with the root component (the
// sidebar shell) and the providers in app.config.ts.
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
