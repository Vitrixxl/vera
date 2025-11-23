import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-survey-done',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 text-center">
          <!-- Success Icon -->
          <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <!-- Message -->
          <h1 class="text-3xl font-bold text-gray-900 mb-3">
            Merci !
          </h1>
          <p class="text-gray-600 mb-8">
            Nous avons bien reçu votre réponse. Votre avis est précieux pour nous aider à améliorer Vera.
          </p>

          <!-- Actions -->
          <div class="space-y-3">
            <button
              (click)="goToChat()"
              class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Retour au chat
            </button>
            <button
              (click)="goToDashboard()"
              class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Voir le dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SurveyDoneComponent {
  constructor(private router: Router) {}

  goToChat() {
    this.router.navigate(['/chat']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
