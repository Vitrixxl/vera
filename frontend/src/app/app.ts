import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    @if (authService.isInitialized()) {
      <router-outlet />
    } @else {
      <div class="min-h-screen flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }
  `,
  styleUrl: './app.css',
})
export class App {
  authService = inject(AuthService);
}
