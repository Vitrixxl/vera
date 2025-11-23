import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div class="flex gap-3">
              <button
                (click)="goToSurvey()"
                class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Go to Survey
              </button>
              <button class="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <!-- Stats Grid -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-white rounded-lg shadow p-6">
                <div class="animate-pulse">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 bg-gray-200 rounded-md p-3 w-12 h-12"></div>
                    <div class="ml-5 flex-1">
                      <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div class="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Stat Card 1 -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Total Surveys</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ totalSurveys() }}</p>
                </div>
              </div>
            </div>

            <!-- Stat Card 2 -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Responses</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ totalSurveys() }}</p>
                </div>
              </div>
            </div>

            <!-- Stat Card 3 -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Average Rating</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ avgRating() }}/10</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Survey List -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Surveys</h2>
          </div>

          @if (isLoading()) {
            <div class="px-6 py-8">
              <div class="animate-pulse space-y-4">
                @for (i of [1, 2, 3]; track i) {
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gray-200 rounded"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (surveys().length === 0) {
            <div class="px-6 py-8">
              <div class="text-center text-gray-500">
                <p>No surveys available</p>
                <p class="text-sm mt-2">Survey data will appear here</p>
              </div>
            </div>
          } @else {
            <div class="divide-y divide-gray-200">
              @for (survey of surveys(); track survey.id) {
                <div
                  (click)="openSurveyDialog(survey)"
                  class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3">
                        <div class="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
                             [class.bg-green-100]="survey.note >= 7"
                             [class.bg-yellow-100]="survey.note >= 4 && survey.note < 7"
                             [class.bg-red-100]="survey.note < 4">
                          <span class="text-xl font-bold"
                                [class.text-green-600]="survey.note >= 7"
                                [class.text-yellow-600]="survey.note >= 4 && survey.note < 7"
                                [class.text-red-600]="survey.note < 4">
                            {{ survey.note }}
                          </span>
                        </div>
                        <div class="flex-1 min-w-0">
                          @if (survey.commentary) {
                            <p class="text-gray-900 truncate line-clamp-1">{{ survey.commentary }}</p>
                          } @else {
                            <p class="text-gray-400 italic">No comment</p>
                          }
                          <p class="text-sm text-gray-500">{{ formatDate(survey.createdAt) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
              @if (loadingMore()) {
                <div class="px-6 py-4 text-center">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                </div>
              }
              @if (hasMore() === false && surveys().length > 0) {
                <div class="px-6 py-4 text-center text-sm text-gray-400">
                  No more surveys
                </div>
              }
            </div>
          }
        </div>
      </main>

      <!-- Survey Dialog -->
      @if (selectedSurvey()) {
        <div
          class="fixed inset-0 flex items-center justify-center p-4 z-50"
          style="background-color: rgba(0, 0, 0, 0.5)"
          (click)="closeSurveyDialog()">
          <div
            class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold text-gray-900">Survey Details</h2>
              <button
                (click)="closeSurveyDialog()"
                class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div class="space-y-4">
              <!-- Rating -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div class="flex items-center gap-3">
                  <div class="flex items-center justify-center w-16 h-16 rounded-full"
                       [class.bg-green-100]="selectedSurvey()!.note >= 7"
                       [class.bg-yellow-100]="selectedSurvey()!.note >= 4 && selectedSurvey()!.note < 7"
                       [class.bg-red-100]="selectedSurvey()!.note < 4">
                    <span class="text-3xl font-bold"
                          [class.text-green-600]="selectedSurvey()!.note >= 7"
                          [class.text-yellow-600]="selectedSurvey()!.note >= 4 && selectedSurvey()!.note < 7"
                          [class.text-red-600]="selectedSurvey()!.note < 4">
                      {{ selectedSurvey()!.note }}
                    </span>
                  </div>
                  <span class="text-gray-600">/ 10</span>
                </div>
              </div>

              <!-- Commentary -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Commentary</label>
                @if (selectedSurvey()!.commentary) {
                  <p class="text-gray-900 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">{{ selectedSurvey()!.commentary }}</p>
                } @else {
                  <p class="text-gray-400 italic bg-gray-50 rounded-lg p-4">No comment provided</p>
                }
              </div>

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Submitted</label>
                <p class="text-gray-900">{{ formatFullDate(selectedSurvey()!.createdAt) }}</p>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="closeSurveyDialog()"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  totalSurveys = signal(0);
  avgRating = signal(0);
  surveys = signal<any[]>([]);
  isLoading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  currentCursor = 0;
  limit = 10;
  selectedSurvey = signal<any>(null);

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadStats();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const pos = (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight;
    const threshold = 200;

    if (pos > max - threshold) {
      this.loadMoreSurveys();
    }
  }

  async loadStats() {
    this.isLoading.set(true);

    try {
      const totalResponse = await api.survey.total.get();
      if (totalResponse.data) {
        this.totalSurveys.set(totalResponse.data);
      }

      const avgResponse = await api.survey.avg.get();
      if (avgResponse.data) {
        this.avgRating.set(Number(avgResponse.data.toFixed(1)));
      }

      // Fetch recent surveys
      await this.loadSurveys();
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSurveys() {
    console.log('loadSurveys called');
    try {
      console.log('Calling API with params:', {
        limit: this.limit,
        cursor: this.currentCursor
      });

      const surveysResponse = await api.survey.surveys.get({
        query: {
          limit: this.limit,
          cursor: this.currentCursor
        }
      });

      console.log('Surveys response:', surveysResponse);

      if (surveysResponse.data) {
        const data = surveysResponse.data as any;
        console.log('Surveys data:', data);
        this.surveys.set(data.surveys || []);
        this.hasMore.set(data.nextCursor !== null);
        if (data.nextCursor) {
          this.currentCursor = data.nextCursor;
        }
      }

      if (surveysResponse.error) {
        console.error('Surveys error:', surveysResponse.error);
      }
    } catch (error) {
      console.error('Load surveys error:', error);
    }
  }

  async loadMoreSurveys() {
    if (this.loadingMore() || !this.hasMore()) return;

    this.loadingMore.set(true);

    try {
      const surveysResponse = await api.survey.surveys.get({
        query: {
          limit: this.limit,
          cursor: this.currentCursor
        }
      });

      if (surveysResponse.data) {
        const data = surveysResponse.data as any;
        this.surveys.update(current => [...current, ...(data.surveys || [])]);
        this.hasMore.set(data.nextCursor !== null);
        if (data.nextCursor) {
          this.currentCursor = data.nextCursor;
        }
      }
    } catch (error) {
      console.error('Error loading more surveys:', error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  formatFullDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openSurveyDialog(survey: any) {
    this.selectedSurvey.set(survey);
  }

  closeSurveyDialog() {
    this.selectedSurvey.set(null);
  }

  goToSurvey() {
    this.router.navigate(['/survey']);
  }
}
