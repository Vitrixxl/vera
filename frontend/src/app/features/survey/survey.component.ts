import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';

// Types for survey responses
type Q1Channel = 'whatsapp' | 'instagram' | 'phone' | 'website';
type Q2QuestionsCount = '1' | '2-3' | '4-5' | '5+';
type Q3Clarity = 'clear' | 'technical' | 'difficult' | 'no_response';
type Q4Reliability = 'yes_totally' | 'yes_rather' | 'not_really' | 'no' | 'need_verify';
type Q6Liked = 'speed' | 'sources' | 'free' | 'simple' | 'accessible' | 'neutral';
type Q7Improvement = 'faster' | 'design' | 'clarity' | 'explanations' | 'followup' | 'notifications' | 'nothing';
type Q8Reuse = 'yes_always' | 'yes_sometimes' | 'maybe' | 'probably_not' | 'certainly_not';
type Q9Recommend = 'yes_certainly' | 'yes_probably' | 'maybe' | 'probably_not' | 'certainly_not';
type Q10BehaviorChange = 'yes_systematic' | 'more_careful' | 'not_really' | 'too_early';
type Q11BadgeFeature = 'love_it' | 'cool' | 'meh' | 'useless';
type Q12Discovery = 'questionnaire' | 'landing' | 'instagram' | 'friend';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div class="max-w-2xl mx-auto">
        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              class="h-full bg-indigo-600 transition-all duration-300"
              [style.width.%]="progress()"
            ></div>
          </div>
          <p class="text-sm text-gray-500 mt-2 text-center">
            {{ currentStep() === 0 ? 'Bienvenue' : 'Question ' + currentStep() + ' / 13' }}
          </p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-xl p-8">
          <!-- Welcome Screen -->
          @if (currentStep() === 0) {
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">
                Tu as testé VERA ? On veut tout savoir !
              </h1>
              <div class="text-left text-gray-600 space-y-4 mb-8">
                <p>
                  Pour rappel : VERA transforme la vérification des faits en un geste simple.
                  Pose ta question via WhatsApp, Instagram ou appel, et reçois une réponse sourcée en 3 secondes.
                </p>
                <p>
                  Il y a quelques jours, tu as découvert VERA via notre campagne et ton avis compte
                  énormément pour nous aider à améliorer l'expérience.
                </p>
                <div class="flex flex-wrap gap-4 justify-center text-sm">
                  <span class="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">Durée : 3 minutes max</span>
                  <span class="bg-green-50 text-green-700 px-3 py-1 rounded-full">Anonyme</span>
                  <span class="bg-amber-50 text-amber-700 px-3 py-1 rounded-full">Tes réponses nous aident</span>
                </div>
              </div>
              <button
                (click)="nextStep()"
                class="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Commencer le questionnaire
              </button>
            </div>
          }

          <!-- Q1: Channels -->
          @if (currentStep() === 1) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Q1. Par quel canal as-tu contacté VERA ?</h2>
              <p class="text-gray-500 text-sm mb-6">Plusieurs réponses possibles</p>
              <div class="space-y-3">
                @for (option of q1Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q1Channels().includes(option.value)"
                    [class.bg-indigo-50]="q1Channels().includes(option.value)">
                    <input type="checkbox" [checked]="q1Channels().includes(option.value)"
                      (change)="toggleQ1(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q1Channels().includes(option.value)"
                      [class.bg-indigo-500]="q1Channels().includes(option.value)">
                      @if (q1Channels().includes(option.value)) {
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q2: Questions Count -->
          @if (currentStep() === 2) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q2. Combien de questions as-tu posées à VERA ?</h2>
              <div class="space-y-3">
                @for (option of q2Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q2QuestionsCount() === option.value"
                    [class.bg-indigo-50]="q2QuestionsCount() === option.value">
                    <input type="radio" name="q2" [value]="option.value" [checked]="q2QuestionsCount() === option.value"
                      (change)="q2QuestionsCount.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q2QuestionsCount() === option.value">
                      @if (q2QuestionsCount() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q3: Clarity -->
          @if (currentStep() === 3) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q3. La réponse de VERA était :</h2>
              <div class="space-y-3">
                @for (option of q3Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q3Clarity() === option.value"
                    [class.bg-indigo-50]="q3Clarity() === option.value">
                    <input type="radio" name="q3" [value]="option.value" [checked]="q3Clarity() === option.value"
                      (change)="q3Clarity.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q3Clarity() === option.value">
                      @if (q3Clarity() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q4: Reliability -->
          @if (currentStep() === 4) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q4. As-tu trouvé la réponse de VERA fiable ?</h2>
              <div class="space-y-3">
                @for (option of q4Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q4Reliability() === option.value"
                    [class.bg-indigo-50]="q4Reliability() === option.value">
                    <input type="radio" name="q4" [value]="option.value" [checked]="q4Reliability() === option.value"
                      (change)="q4Reliability.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q4Reliability() === option.value">
                      @if (q4Reliability() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q5: Experience Rating -->
          @if (currentStep() === 5) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q5. Sur une échelle de 1 à 5, l'expérience avec VERA était :</h2>
              <div class="space-y-3">
                @for (option of q5Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q5ExperienceRating() === option.value"
                    [class.bg-indigo-50]="q5ExperienceRating() === option.value">
                    <input type="radio" name="q5" [value]="option.value" [checked]="q5ExperienceRating() === option.value"
                      (change)="q5ExperienceRating.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q5ExperienceRating() === option.value">
                      @if (q5ExperienceRating() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q6: Liked -->
          @if (currentStep() === 6) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Q6. Qu'est-ce qui t'a le plus plu chez VERA ?</h2>
              <p class="text-gray-500 text-sm mb-6">Plusieurs réponses possibles</p>
              <div class="space-y-3">
                @for (option of q6Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q6Liked().includes(option.value)"
                    [class.bg-indigo-50]="q6Liked().includes(option.value)">
                    <input type="checkbox" [checked]="q6Liked().includes(option.value)"
                      (change)="toggleQ6(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q6Liked().includes(option.value)"
                      [class.bg-indigo-500]="q6Liked().includes(option.value)">
                      @if (q6Liked().includes(option.value)) {
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q7: Improvements -->
          @if (currentStep() === 7) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Q7. Qu'est-ce qui pourrait être amélioré ?</h2>
              <p class="text-gray-500 text-sm mb-6">Plusieurs réponses possibles</p>
              <div class="space-y-3">
                @for (option of q7Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q7Improvements().includes(option.value)"
                    [class.bg-indigo-50]="q7Improvements().includes(option.value)">
                    <input type="checkbox" [checked]="q7Improvements().includes(option.value)"
                      (change)="toggleQ7(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q7Improvements().includes(option.value)"
                      [class.bg-indigo-500]="q7Improvements().includes(option.value)">
                      @if (q7Improvements().includes(option.value)) {
                        <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q8: Reuse -->
          @if (currentStep() === 8) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q8. Vas-tu réutiliser VERA ?</h2>
              <div class="space-y-3">
                @for (option of q8Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q8Reuse() === option.value"
                    [class.bg-indigo-50]="q8Reuse() === option.value">
                    <input type="radio" name="q8" [value]="option.value" [checked]="q8Reuse() === option.value"
                      (change)="q8Reuse.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q8Reuse() === option.value">
                      @if (q8Reuse() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q9: Recommend -->
          @if (currentStep() === 9) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q9. Recommanderais-tu VERA à tes amis ?</h2>
              <div class="space-y-3">
                @for (option of q9Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q9Recommend() === option.value"
                    [class.bg-indigo-50]="q9Recommend() === option.value">
                    <input type="radio" name="q9" [value]="option.value" [checked]="q9Recommend() === option.value"
                      (change)="q9Recommend.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q9Recommend() === option.value">
                      @if (q9Recommend() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q10: Behavior Change -->
          @if (currentStep() === 10) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q10. Depuis que tu as testé VERA, as-tu changé ta manière de consommer l'info sur les réseaux ?</h2>
              <div class="space-y-3">
                @for (option of q10Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q10BehaviorChange() === option.value"
                    [class.bg-indigo-50]="q10BehaviorChange() === option.value">
                    <input type="radio" name="q10" [value]="option.value" [checked]="q10BehaviorChange() === option.value"
                      (change)="q10BehaviorChange.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q10BehaviorChange() === option.value">
                      @if (q10BehaviorChange() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q11: Badge Feature -->
          @if (currentStep() === 11) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q11. Si VERA avait une fonctionnalité "badge" ou "stats" pour montrer combien d'infos tu as vérifiées, tu trouverais ça :</h2>
              <div class="space-y-3">
                @for (option of q11Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q11BadgeFeature() === option.value"
                    [class.bg-indigo-50]="q11BadgeFeature() === option.value">
                    <input type="radio" name="q11" [value]="option.value" [checked]="q11BadgeFeature() === option.value"
                      (change)="q11BadgeFeature.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q11BadgeFeature() === option.value">
                      @if (q11BadgeFeature() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q12: Discovery -->
          @if (currentStep() === 12) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-6">Q12. Comment as-tu découvert VERA ?</h2>
              <div class="space-y-3">
                @for (option of q12Options; track option.value) {
                  <label class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    [class.border-indigo-500]="q12Discovery() === option.value"
                    [class.bg-indigo-50]="q12Discovery() === option.value">
                    <input type="radio" name="q12" [value]="option.value" [checked]="q12Discovery() === option.value"
                      (change)="q12Discovery.set(option.value)" class="sr-only">
                    <span class="w-5 h-5 border-2 rounded-full mr-3 flex items-center justify-center"
                      [class.border-indigo-500]="q12Discovery() === option.value">
                      @if (q12Discovery() === option.value) {
                        <span class="w-3 h-3 bg-indigo-500 rounded-full"></span>
                      }
                    </span>
                    {{ option.label }}
                  </label>
                }
              </div>
            </div>
          }

          <!-- Q13: Comment -->
          @if (currentStep() === 13) {
            <div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Q13. Un dernier mot pour nous ?</h2>
              <p class="text-gray-500 text-sm mb-6">Facultatif</p>
              <textarea
                [(ngModel)]="q13Comment"
                name="q13"
                rows="4"
                placeholder="Partage-nous ton retour, une suggestion, un encouragement..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
          }

          <!-- Navigation Buttons -->
          @if (currentStep() > 0) {
            <div class="flex gap-4 mt-8">
              <button
                (click)="prevStep()"
                class="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
              @if (currentStep() < 13) {
                <button
                  (click)="nextStep()"
                  [disabled]="!canProceed()"
                  class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                </button>
              } @else {
                <button
                  (click)="handleSubmit()"
                  [disabled]="isSubmitting()"
                  class="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isSubmitting() ? 'Envoi...' : 'Envoyer' }}
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SurveyComponent {
  currentStep = signal(0);
  isSubmitting = signal(false);

  // Survey responses
  q1Channels = signal<Q1Channel[]>([]);
  q2QuestionsCount = signal<Q2QuestionsCount | null>(null);
  q3Clarity = signal<Q3Clarity | null>(null);
  q4Reliability = signal<Q4Reliability | null>(null);
  q5ExperienceRating = signal<1 | 2 | 3 | 4 | 5 | null>(null);
  q6Liked = signal<Q6Liked[]>([]);
  q7Improvements = signal<Q7Improvement[]>([]);
  q8Reuse = signal<Q8Reuse | null>(null);
  q9Recommend = signal<Q9Recommend | null>(null);
  q10BehaviorChange = signal<Q10BehaviorChange | null>(null);
  q11BadgeFeature = signal<Q11BadgeFeature | null>(null);
  q12Discovery = signal<Q12Discovery | null>(null);
  q13Comment = '';

  // Options
  q1Options: { value: Q1Channel; label: string }[] = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'instagram', label: 'Instagram/TikTok DM' },
    { value: 'phone', label: 'Appel téléphonique' },
    { value: 'website', label: 'Site web VERA' },
  ];

  q2Options: { value: Q2QuestionsCount; label: string }[] = [
    { value: '1', label: '1 seule question' },
    { value: '2-3', label: '2-3 questions' },
    { value: '4-5', label: '4-5 questions' },
    { value: '5+', label: 'Plus de 5 questions' },
  ];

  q3Options: { value: Q3Clarity; label: string }[] = [
    { value: 'clear', label: 'Claire et facile à comprendre' },
    { value: 'technical', label: 'Plutôt claire mais un peu technique' },
    { value: 'difficult', label: 'Difficile à comprendre' },
    { value: 'no_response', label: "Je n'ai pas reçu de réponse" },
  ];

  q4Options: { value: Q4Reliability; label: string }[] = [
    { value: 'yes_totally', label: 'Oui, totalement' },
    { value: 'yes_rather', label: 'Oui, plutôt' },
    { value: 'not_really', label: 'Pas vraiment' },
    { value: 'no', label: 'Non, pas du tout' },
    { value: 'need_verify', label: "Je ne sais pas / j'ai besoin de vérifier ailleurs" },
  ];

  q5Options: { value: 1 | 2 | 3 | 4 | 5; label: string }[] = [
    { value: 1, label: '1 - Très décevante' },
    { value: 2, label: '2 - Décevante' },
    { value: 3, label: '3 - Correcte' },
    { value: 4, label: '4 - Satisfaisante' },
    { value: 5, label: '5 - Excellente' },
  ];

  q6Options: { value: Q6Liked; label: string }[] = [
    { value: 'speed', label: 'La rapidité de la réponse' },
    { value: 'sources', label: 'Les sources fiables citées' },
    { value: 'free', label: "C'est gratuit" },
    { value: 'simple', label: "Simple d'utilisation" },
    { value: 'accessible', label: 'Accessible via Instagram/WhatsApp' },
    { value: 'neutral', label: 'Neutre et factuel (pas de bla-bla)' },
  ];

  q7Options: { value: Q7Improvement; label: string }[] = [
    { value: 'faster', label: 'La rapidité (encore plus rapide)' },
    { value: 'design', label: "L'interface / le design" },
    { value: 'clarity', label: 'La clarté des réponses' },
    { value: 'explanations', label: "Plus d'explications pédagogiques" },
    { value: 'followup', label: 'Possibilité de poser des questions de suivi' },
    { value: 'notifications', label: 'Notifications pour les infos virales fake' },
    { value: 'nothing', label: "Rien, c'était parfait" },
  ];

  q8Options: { value: Q8Reuse; label: string }[] = [
    { value: 'yes_always', label: "Oui, à chaque fois que je doute d'une info" },
    { value: 'yes_sometimes', label: 'Oui, de temps en temps' },
    { value: 'maybe', label: "Peut-être, si j'y pense" },
    { value: 'probably_not', label: 'Non, probablement pas' },
    { value: 'certainly_not', label: 'Non, certainement pas' },
  ];

  q9Options: { value: Q9Recommend; label: string }[] = [
    { value: 'yes_certainly', label: 'Oui, certainement' },
    { value: 'yes_probably', label: 'Oui, probablement' },
    { value: 'maybe', label: 'Peut-être' },
    { value: 'probably_not', label: 'Non, probablement pas' },
    { value: 'certainly_not', label: 'Non, certainement pas' },
  ];

  q10Options: { value: Q10BehaviorChange; label: string }[] = [
    { value: 'yes_systematic', label: 'Oui, je vérifie plus systématiquement maintenant' },
    { value: 'more_careful', label: 'Un peu, je suis plus attentif·ve' },
    { value: 'not_really', label: 'Non, pas vraiment' },
    { value: 'too_early', label: 'Trop tôt pour le dire' },
  ];

  q11Options: { value: Q11BadgeFeature; label: string }[] = [
    { value: 'love_it', label: "Hyper motivant, j'adore l'idée" },
    { value: 'cool', label: 'Cool, pourquoi pas' },
    { value: 'meh', label: 'Bof, ça ne changerait rien pour moi' },
    { value: 'useless', label: "Inutile, je m'en fous" },
  ];

  q12Options: { value: Q12Discovery; label: string }[] = [
    { value: 'questionnaire', label: 'Via notre questionnaire il y a 3 jours' },
    { value: 'landing', label: 'Via la landing page de la campagne' },
    { value: 'instagram', label: 'Via Instagram @vera_groupe1' },
    { value: 'friend', label: "Recommandation d'un ami" },
  ];

  constructor(private router: Router) {}

  progress() {
    return (this.currentStep() / 13) * 100;
  }

  canProceed(): boolean {
    const step = this.currentStep();
    switch (step) {
      case 1: return this.q1Channels().length > 0;
      case 2: return this.q2QuestionsCount() !== null;
      case 3: return this.q3Clarity() !== null;
      case 4: return this.q4Reliability() !== null;
      case 5: return this.q5ExperienceRating() !== null;
      case 6: return this.q6Liked().length > 0;
      case 7: return this.q7Improvements().length > 0;
      case 8: return this.q8Reuse() !== null;
      case 9: return this.q9Recommend() !== null;
      case 10: return this.q10BehaviorChange() !== null;
      case 11: return this.q11BadgeFeature() !== null;
      case 12: return this.q12Discovery() !== null;
      case 13: return true; // Q13 is optional
      default: return true;
    }
  }

  nextStep() {
    if (this.canProceed()) {
      this.currentStep.update(s => s + 1);
    }
  }

  prevStep() {
    this.currentStep.update(s => Math.max(0, s - 1));
  }

  toggleQ1(value: Q1Channel) {
    this.q1Channels.update(arr =>
      arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    );
  }

  toggleQ6(value: Q6Liked) {
    this.q6Liked.update(arr =>
      arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    );
  }

  toggleQ7(value: Q7Improvement) {
    this.q7Improvements.update(arr =>
      arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    );
  }

  async handleSubmit() {
    this.isSubmitting.set(true);

    try {
      const { data, error } = await api.survey.post({
        q1Channels: this.q1Channels(),
        q2QuestionsCount: this.q2QuestionsCount()!,
        q3Clarity: this.q3Clarity()!,
        q4Reliability: this.q4Reliability()!,
        q5ExperienceRating: this.q5ExperienceRating()!,
        q6Liked: this.q6Liked(),
        q7Improvements: this.q7Improvements(),
        q8Reuse: this.q8Reuse()!,
        q9Recommend: this.q9Recommend()!,
        q10BehaviorChange: this.q10BehaviorChange()!,
        q11BadgeFeature: this.q11BadgeFeature()!,
        q12Discovery: this.q12Discovery()!,
        q13Comment: this.q13Comment || null,
      });

      if (error) {
        console.error('Survey submission error:', error);
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
