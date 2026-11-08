import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeSwitchComponent } from './shared/theme-switch.component';
import { ToastComponent } from './shared/toast.component';

/** The app shell: sidebar (logo, nav, theme switch) plus the routed page.
    The toast lives here so a notice survives navigating to another page.
    On narrow screens the sidebar becomes a top bar (see the .scss). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent, ThemeSwitchComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
