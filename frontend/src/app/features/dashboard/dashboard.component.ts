import { Component, signal, OnInit } from '@angular/core';
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
          <div class="px-6 py-8">
            <div class="text-center text-gray-500">
              <p>No surveys available</p>
              <p class="text-sm mt-2">Survey data will appear here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  totalSurveys = signal(0);
  avgRating = signal(0);
  isLoading = signal(true);

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadStats();
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
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToSurvey() {
    this.router.navigate(['/survey']);
  }
}
