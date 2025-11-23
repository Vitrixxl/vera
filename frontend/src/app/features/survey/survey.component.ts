import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4"
    >
      <div class="max-w-2xl w-full">
        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-3">Merci d'avoir utilisé Vera !</h1>
            <p class="text-gray-600">
              Pourriez-vous prendre un moment pour nous donner votre avis ?
            </p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="handleSubmit()">
            <!-- Rating Slider -->
            <div class="mb-8">
              <label class="block text-lg font-medium text-gray-900 mb-4">
                Comment évalueriez-vous votre expérience ?
              </label>

              <div class="space-y-4">
                <!-- Slider -->
                <input
                  type="range"
                  min="0"
                  max="10"
                  [(ngModel)]="rating"
                  name="rating"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <!-- Rating Display -->
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-500">0 - Très insatisfait</span>
                  <div class="flex items-center gap-2">
                    <span class="text-4xl font-bold text-indigo-600">{{ rating() }}</span>
                    <span class="text-gray-400">/10</span>
                  </div>
                  <span class="text-sm text-gray-500">10 - Très satisfait</span>
                </div>
              </div>
            </div>

            <!-- Comment Field -->
            <div class="mb-8">
              <label class="block text-lg font-medium text-gray-900 mb-3">
                Commentaire (optionnel)
              </label>
              <textarea
                [(ngModel)]="comment"
                name="comment"
                rows="4"
                placeholder="Partagez-nous votre expérience, vos suggestions..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="isSubmitting()"
              class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {{ isSubmitting() ? 'Envoi en cours...' : 'Envoyer' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class SurveyComponent {
  rating = signal(5);
  comment = '';
  isSubmitting = signal(false);

  constructor(private router: Router) {}

  async handleSubmit() {
    this.isSubmitting.set(true);

    try {
      const { data, error } = await api.survey.post({
        note: this.rating(),
        commentary: this.comment || null,
      });

      if (error) {
        console.error('Survey submission error:', error);
        // TODO: Show error message to user
        this.isSubmitting.set(false);
        return;
      }

      console.log('Survey submitted successfully:', data);
      this.router.navigate(['/survey/done']);
    } catch (err) {
      console.error('Survey submission error:', err);
      this.isSubmitting.set(false);
    }
  }
}
