import { Component, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';

// Labels for displaying survey values
const LABELS: Record<string, Record<string, string>> = {
  q1Channels: {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram/TikTok',
    phone: 'Téléphone',
    website: 'Site web',
  },
  q2QuestionsCount: {
    '1': '1 question',
    '2-3': '2-3 questions',
    '4-5': '4-5 questions',
    '5+': '5+ questions',
  },
  q3Clarity: {
    clear: 'Claire',
    technical: 'Technique',
    difficult: 'Difficile',
    no_response: 'Pas de réponse',
  },
  q4Reliability: {
    yes_totally: 'Oui, totalement',
    yes_rather: 'Oui, plutôt',
    not_really: 'Pas vraiment',
    no: 'Non',
    need_verify: 'Besoin vérifier',
  },
  q6Liked: {
    speed: 'Rapidité',
    sources: 'Sources',
    free: 'Gratuit',
    simple: 'Simple',
    accessible: 'Accessible',
    neutral: 'Neutre',
  },
  q7Improvements: {
    faster: 'Plus rapide',
    design: 'Design',
    clarity: 'Clarté',
    explanations: 'Explications',
    followup: 'Suivi',
    notifications: 'Notifications',
    nothing: 'Rien',
  },
  q8Reuse: {
    yes_always: 'Oui, toujours',
    yes_sometimes: 'Oui, parfois',
    maybe: 'Peut-être',
    probably_not: 'Probablement pas',
    certainly_not: 'Certainement pas',
  },
  q9Recommend: {
    yes_certainly: 'Oui, certainement',
    yes_probably: 'Oui, probablement',
    maybe: 'Peut-être',
    probably_not: 'Probablement pas',
    certainly_not: 'Certainement pas',
  },
  q10BehaviorChange: {
    yes_systematic: 'Oui, systématique',
    more_careful: 'Plus attentif',
    not_really: 'Pas vraiment',
    too_early: 'Trop tôt',
  },
  q11BadgeFeature: {
    love_it: "J'adore",
    cool: 'Cool',
    meh: 'Bof',
    useless: 'Inutile',
  },
  q12Discovery: {
    questionnaire: 'Questionnaire',
    landing: 'Landing page',
    instagram: 'Instagram',
    friend: 'Ami',
  },
};

interface SurveyStats {
  total: number;
  avgExperienceRating: number;
  recommendRate: number;
  reuseRate: number;
  distributions: Record<string, Record<string, number>>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard VERA</h1>
            <div class="flex gap-3">
              <button
                (click)="goToSurvey()"
                class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Voir le Survey
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <!-- Search Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <!-- Survey Search -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Rechercher des surveys</h3>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="surveySearchQuery"
                (keyup.enter)="searchSurveys()"
                placeholder="Ex: utilisateurs satisfaits..."
                class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                (click)="searchSurveys()"
                [disabled]="searchingSurveys()"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
              >
                @if (searchingSurveys()) {
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                }
              </button>
            </div>
            @if (surveySearchResults().length > 0) {
              <div class="mt-4 max-h-64 overflow-y-auto space-y-2">
                @for (result of surveySearchResults(); track result.id) {
                  <div
                    (click)="openSurveyDialog(result)"
                    class="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-sm font-bold px-2 py-1 rounded"
                        [class.bg-green-100]="result.q5ExperienceRating >= 4"
                        [class.text-green-700]="result.q5ExperienceRating >= 4"
                        [class.bg-yellow-100]="result.q5ExperienceRating === 3"
                        [class.text-yellow-700]="result.q5ExperienceRating === 3"
                        [class.bg-red-100]="result.q5ExperienceRating <= 2"
                        [class.text-red-700]="result.q5ExperienceRating <= 2"
                      >{{ result.q5ExperienceRating }}/5</span>
                      <span class="text-xs text-gray-500">{{ formatDate(result.createdAt) }}</span>
                    </div>
                    @if (result.q13Comment) {
                      <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ result.q13Comment }}</p>
                    }
                  </div>
                }
              </div>
            }
            @if (surveySearchQuery && surveySearchResults().length === 0 && !searchingSurveys()) {
              <p class="mt-4 text-sm text-gray-500 text-center">Aucun résultat</p>
            }
          </div>

          <!-- Questions Search -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Rechercher des questions</h3>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="questionSearchQuery"
                (keyup.enter)="searchQuestions()"
                placeholder="Ex: délai de livraison..."
                class="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                (click)="searchQuestions()"
                [disabled]="searchingQuestions()"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600"
              >
                @if (searchingQuestions()) {
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                }
              </button>
            </div>
            @if (questionSearchResults().length > 0) {
              <div class="mt-4 max-h-64 overflow-y-auto space-y-2">
                @for (result of questionSearchResults(); track result.id) {
                  <div class="p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-800">{{ result.question }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ formatDate(result.createdAt) }}</p>
                  </div>
                }
              </div>
            }
            @if (questionSearchQuery && questionSearchResults().length === 0 && !searchingQuestions()) {
              <p class="mt-4 text-sm text-gray-500 text-center">Aucun résultat</p>
            }
          </div>

          <!-- Hot Questions -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900">Questions tendances</h3>
              <svg class="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
              </svg>
            </div>
            @if (loadingHotQuestions()) {
              <div class="space-y-3">
                @for (i of [1, 2, 3, 4, 5]; track i) {
                  <div class="animate-pulse">
                    <div class="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                }
              </div>
            } @else if (hotQuestions().length > 0) {
              <div class="space-y-3">
                @for (q of hotQuestions(); track q.id; let i = $index) {
                  <div class="flex items-center gap-3">
                    <span
                      class="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full"
                      [class.bg-orange-100]="i < 3"
                      [class.text-orange-700]="i < 3"
                      [class.bg-gray-100]="i >= 3"
                      [class.text-gray-600]="i >= 3"
                    >{{ i + 1 }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-gray-800 truncate">{{ q.question }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm text-gray-500 text-center">Aucune question tendance</p>
            }
          </div>
        </div>

        <!-- Key Metrics -->
        @if (isLoading()) {
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="bg-white rounded-lg shadow p-6 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div class="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <!-- Total Responses -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                  <svg
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    ></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Total Réponses</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats()?.total || 0 }}</p>
                </div>
              </div>
            </div>

            <!-- Average Rating -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <svg class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    ></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Note Moyenne</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ stats()?.avgExperienceRating || 0 }}/5
                  </p>
                </div>
              </div>
            </div>

            <!-- Recommend Rate -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <svg
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    ></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Recommandent</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ stats()?.recommendRate || 0 }}%
                  </p>
                </div>
              </div>
            </div>

            <!-- Reuse Rate -->
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <svg
                    class="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    ></path>
                  </svg>
                </div>
                <div class="ml-5">
                  <p class="text-sm font-medium text-gray-500">Réutiliseront</p>
                  <p class="text-2xl font-semibold text-gray-900">{{ stats()?.reuseRate || 0 }}%</p>
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Distribution Charts -->
        @if (!isLoading() && stats()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Q5: Experience Rating Distribution -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Note d'expérience (Q5)</h3>
              <div class="space-y-3">
                @for (rating of [5, 4, 3, 2, 1]; track rating) {
                  <div class="flex items-center gap-3">
                    <span class="w-20 text-sm text-gray-600"
                      >{{ rating }}
                      {{ rating === 5 ? 'Excellent' : rating === 1 ? 'Décevant' : '' }}</span
                    >
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        [class.bg-green-500]="rating >= 4"
                        [class.bg-yellow-500]="rating === 3"
                        [class.bg-red-500]="rating <= 2"
                        [style.width.%]="getPercentage('q5ExperienceRating', rating.toString())"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{
                      getCount('q5ExperienceRating', rating.toString())
                    }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Q1: Channels -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Canaux utilisés (Q1)</h3>
              <div class="space-y-3">
                @for (item of getDistributionItems('q1Channels'); track item.key) {
                  <div class="flex items-center gap-3">
                    <span class="w-28 text-sm text-gray-600 truncate">{{ item.label }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full bg-indigo-500 rounded-full"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Q6: What they liked -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Ce qui a plu (Q6)</h3>
              <div class="space-y-3">
                @for (item of getDistributionItems('q6Liked'); track item.key) {
                  <div class="flex items-center gap-3">
                    <span class="w-28 text-sm text-gray-600 truncate">{{ item.label }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full bg-green-500 rounded-full"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Q7: Improvements -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">À améliorer (Q7)</h3>
              <div class="space-y-3">
                @for (item of getDistributionItems('q7Improvements'); track item.key) {
                  <div class="flex items-center gap-3">
                    <span class="w-28 text-sm text-gray-600 truncate">{{ item.label }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full bg-amber-500 rounded-full"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Q9: Recommend -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Recommandation (Q9)</h3>
              <div class="space-y-3">
                @for (item of getDistributionItems('q9Recommend'); track item.key) {
                  <div class="flex items-center gap-3">
                    <span class="w-32 text-sm text-gray-600 truncate">{{ item.label }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full bg-blue-500 rounded-full"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Q12: Discovery -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Découverte (Q12)</h3>
              <div class="space-y-3">
                @for (item of getDistributionItems('q12Discovery'); track item.key) {
                  <div class="flex items-center gap-3">
                    <span class="w-28 text-sm text-gray-600 truncate">{{ item.label }}</span>
                    <div class="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        class="h-full bg-purple-500 rounded-full"
                        [style.width.%]="item.percentage"
                      ></div>
                    </div>
                    <span class="w-12 text-sm text-gray-600 text-right">{{ item.count }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Survey List -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Réponses récentes</h2>
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
                <p>Aucune réponse pour le moment</p>
              </div>
            </div>
          } @else {
            <div class="divide-y divide-gray-200">
              @for (survey of surveys(); track survey.id) {
                <div
                  (click)="openSurveyDialog(survey)"
                  class="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div
                        class="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
                        [class.bg-green-100]="survey.q5ExperienceRating >= 4"
                        [class.bg-yellow-100]="survey.q5ExperienceRating === 3"
                        [class.bg-red-100]="survey.q5ExperienceRating <= 2"
                      >
                        <span
                          class="text-xl font-bold"
                          [class.text-green-600]="survey.q5ExperienceRating >= 4"
                          [class.text-yellow-600]="survey.q5ExperienceRating === 3"
                          [class.text-red-600]="survey.q5ExperienceRating <= 2"
                        >
                          {{ survey.q5ExperienceRating }}
                        </span>
                      </div>
                      <div>
                        <div class="flex flex-wrap gap-1 mb-1">
                          @for (channel of survey.q1Channels; track channel) {
                            <span
                              class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded"
                              >{{ getLabel('q1Channels', channel) }}</span
                            >
                          }
                        </div>
                        <p class="text-sm text-gray-500">{{ formatDate(survey.createdAt) }}</p>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      ></path>
                    </svg>
                  </div>
                </div>
              }
              @if (loadingMore()) {
                <div class="px-6 py-4 text-center">
                  <div
                    class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"
                  ></div>
                </div>
              }
              @if (!hasMore() && surveys().length > 0) {
                <div class="px-6 py-4 text-center text-sm text-gray-400">Fin des réponses</div>
              }
            </div>
          }
        </div>
      </main>

      <!-- Survey Detail Dialog -->
      @if (selectedSurvey()) {
        <div
          class="fixed inset-0 flex items-center justify-center p-4 z-50 overflow-y-auto"
          style="background-color: rgba(0, 0, 0, 0.5)"
          (click)="closeSurveyDialog()"
        >
          <div
            class="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-bold text-gray-900">Détail de la réponse</h2>
              <button
                (click)="closeSurveyDialog()"
                class="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            <div class="space-y-6">
              <!-- Rating Display -->
              <div
                class="flex items-center gap-4 p-4 rounded-lg"
                [class.bg-green-50]="selectedSurvey()!.q5ExperienceRating >= 4"
                [class.bg-yellow-50]="selectedSurvey()!.q5ExperienceRating === 3"
                [class.bg-red-50]="selectedSurvey()!.q5ExperienceRating <= 2"
              >
                <div
                  class="text-4xl font-bold"
                  [class.text-green-600]="selectedSurvey()!.q5ExperienceRating >= 4"
                  [class.text-yellow-600]="selectedSurvey()!.q5ExperienceRating === 3"
                  [class.text-red-600]="selectedSurvey()!.q5ExperienceRating <= 2"
                >
                  {{ selectedSurvey()!.q5ExperienceRating }}/5
                </div>
                <div class="text-sm text-gray-600">
                  {{ formatFullDate(selectedSurvey()!.createdAt) }}
                </div>
              </div>

              <!-- Questions Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q1. Canaux</p>
                  <div class="flex flex-wrap gap-1">
                    @for (v of selectedSurvey()!.q1Channels; track v) {
                      <span class="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{{
                        getLabel('q1Channels', v)
                      }}</span>
                    }
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q2. Nombre de questions</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q2QuestionsCount', selectedSurvey()!.q2QuestionsCount) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q3. Clarté</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q3Clarity', selectedSurvey()!.q3Clarity) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q4. Fiabilité</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q4Reliability', selectedSurvey()!.q4Reliability) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q6. Ce qui a plu</p>
                  <div class="flex flex-wrap gap-1">
                    @for (v of selectedSurvey()!.q6Liked; track v) {
                      <span class="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">{{
                        getLabel('q6Liked', v)
                      }}</span>
                    }
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q7. À améliorer</p>
                  <div class="flex flex-wrap gap-1">
                    @for (v of selectedSurvey()!.q7Improvements; track v) {
                      <span class="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded">{{
                        getLabel('q7Improvements', v)
                      }}</span>
                    }
                  </div>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q8. Réutilisation</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q8Reuse', selectedSurvey()!.q8Reuse) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q9. Recommandation</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q9Recommend', selectedSurvey()!.q9Recommend) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q10. Changement comportement</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q10BehaviorChange', selectedSurvey()!.q10BehaviorChange) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-xs text-gray-500 mb-1">Q11. Badge/Stats</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q11BadgeFeature', selectedSurvey()!.q11BadgeFeature) }}
                  </p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg md:col-span-2">
                  <p class="text-xs text-gray-500 mb-1">Q12. Découverte</p>
                  <p class="text-sm font-medium">
                    {{ getLabel('q12Discovery', selectedSurvey()!.q12Discovery) }}
                  </p>
                </div>
              </div>

              <!-- Q13 Comment -->
              @if (selectedSurvey()!.q13Comment) {
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-xs text-blue-600 mb-2">Q13. Commentaire</p>
                  <p class="text-gray-900 whitespace-pre-wrap">
                    {{ selectedSurvey()!.q13Comment }}
                  </p>
                </div>
              }
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="closeSurveyDialog()"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = signal<SurveyStats | null>(null);
  surveys = signal<any[]>([]);
  isLoading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  currentCursor = 0;
  limit = 10;
  selectedSurvey = signal<any>(null);

  // Search & Hot Questions
  surveySearchQuery = '';
  questionSearchQuery = '';
  surveySearchResults = signal<any[]>([]);
  questionSearchResults = signal<any[]>([]);
  hotQuestions = signal<any[]>([]);
  searchingSurveys = signal(false);
  searchingQuestions = signal(false);
  loadingHotQuestions = signal(false);

  private wsConnection: any = null;

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadData();
    this.setupWebSocket();
    this.loadHotQuestions();
  }

  ngOnDestroy() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
  }

  private setupWebSocket() {
    this.wsConnection = api.survey.ws.subscribe();

    this.wsConnection.on('message', ({ data }: { data: { key: string; payload: any } }) => {
      if (data.key === 'new-survey') {
        const { newStats, newSurvey } = data.payload;

        // Update stats
        if (newStats) {
          this.stats.set(newStats as SurveyStats);
        }

        // Add new survey to the top of the list
        if (newSurvey) {
          this.surveys.update(current => [{ ...newSurvey, createdAt: new Date() }, ...current]);
        }
      }
    });
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight;
    const threshold = 200;

    if (pos > max - threshold) {
      this.loadMoreSurveys();
    }
  }

  async loadData() {
    this.isLoading.set(true);

    try {
      // Load stats
      const statsResponse = await api.survey.stats.get();
      if (statsResponse.data) {
        this.stats.set(statsResponse.data as SurveyStats);
      }

      // Load surveys
      await this.loadSurveys();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadSurveys() {
    try {
      const surveysResponse = await api.survey.surveys.get({
        query: {
          limit: this.limit,
          cursor: this.currentCursor,
        },
      });

      if (surveysResponse.data) {
        const data = surveysResponse.data as any;
        this.surveys.set(data.surveys || []);
        this.hasMore.set(data.nextCursor !== null);
        if (data.nextCursor) {
          this.currentCursor = data.nextCursor;
        }
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
          cursor: this.currentCursor,
        },
      });

      if (surveysResponse.data) {
        const data = surveysResponse.data as any;
        this.surveys.update((current) => [...current, ...(data.surveys || [])]);
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

  getLabel(question: string, value: string): string {
    return LABELS[question]?.[value] || value;
  }

  getPercentage(question: string, value: string): number {
    const dist = this.stats()?.distributions[question];
    if (!dist) return 0;
    const total = Object.values(dist).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    return ((dist[value] || 0) / total) * 100;
  }

  getCount(question: string, value: string): number {
    return this.stats()?.distributions[question]?.[value] || 0;
  }

  getDistributionItems(
    question: string,
  ): { key: string; label: string; count: number; percentage: number }[] {
    const dist = this.stats()?.distributions[question];
    if (!dist) return [];

    const total = Object.values(dist).reduce((sum, count) => sum + count, 0);
    if (total === 0) return [];

    return Object.entries(dist)
      .map(([key, count]) => ({
        key,
        label: this.getLabel(question, key),
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
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
      minute: '2-digit',
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

  async searchSurveys() {
    if (!this.surveySearchQuery.trim()) return;

    this.searchingSurveys.set(true);
    try {
      const response = await api.survey.searchEmbedding.get({
        query: { q: this.surveySearchQuery },
      });
      if (response.data) {
        this.surveySearchResults.set(response.data as any[]);
      }
    } catch (error) {
      console.error('Error searching surveys:', error);
    } finally {
      this.searchingSurveys.set(false);
    }
  }

  async searchQuestions() {
    if (!this.questionSearchQuery.trim()) return;

    this.searchingQuestions.set(true);
    try {
      const response = await api.questions['search-embegging'].get({
        query: { q: this.questionSearchQuery },
      });
      if (response.data) {
        this.questionSearchResults.set(response.data as any[]);
      }
    } catch (error) {
      console.error('Error searching questions:', error);
    } finally {
      this.searchingQuestions.set(false);
    }
  }

  async loadHotQuestions() {
    this.loadingHotQuestions.set(true);
    try {
      const response = await api.questions.hot.get();
      if (response.data) {
        this.hotQuestions.set(response.data as any[]);
      }
    } catch (error) {
      console.error('Error loading hot questions:', error);
    } finally {
      this.loadingHotQuestions.set(false);
    }
  }
}
