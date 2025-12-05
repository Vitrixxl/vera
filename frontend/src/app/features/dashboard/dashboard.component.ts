import { Component, signal, OnInit, OnDestroy, HostListener, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
  templateUrl: `./dashboard.component.html`,
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
  downloadingCSV = signal(false);

  // Chart refs
  ratingChartRef = viewChild<ElementRef<HTMLCanvasElement>>('ratingChart');
  channelsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('channelsChart');
  likedChartRef = viewChild<ElementRef<HTMLCanvasElement>>('likedChart');
  improvementsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('improvementsChart');
  recommendChartRef = viewChild<ElementRef<HTMLCanvasElement>>('recommendChart');
  discoveryChartRef = viewChild<ElementRef<HTMLCanvasElement>>('discoveryChart');
  countryChartRef = viewChild<ElementRef<HTMLCanvasElement>>('countryChart');

  private charts: Chart[] = [];
  private wsConnection: any = null;

  constructor(private router: Router) {
    effect(() => {
      const statsData = this.stats();
      if (statsData && !this.isLoading()) {
        setTimeout(() => this.initCharts(), 0);
      }
    });
  }

  ngOnInit() {
    this.loadData();
    this.setupWebSocket();
    this.loadHotQuestions();
  }

  ngOnDestroy() {
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    this.charts.forEach(chart => chart.destroy());
  }

  private initCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    const statsData = this.stats();
    if (!statsData) return;

    // Rating Chart (Bar horizontal)
    const ratingCanvas = this.ratingChartRef()?.nativeElement;
    if (ratingCanvas) {
      const ratingData = [1, 2, 3, 4, 5].map(r => this.getCount('q5ExperienceRating', r.toString()));
      this.charts.push(new Chart(ratingCanvas, {
        type: 'bar',
        data: {
          labels: ['1 - Décevant', '2', '3', '4', '5 - Excellent'],
          datasets: [{
            data: ratingData,
            backgroundColor: ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'],
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true } }
        }
      }));
    }

    // Channels Chart (Doughnut)
    const channelsCanvas = this.channelsChartRef()?.nativeElement;
    if (channelsCanvas) {
      const items = this.getDistributionItems('q1Channels');
      this.charts.push(new Chart(channelsCanvas, {
        type: 'doughnut',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }));
    }

    // Liked Chart (Polar Area)
    const likedCanvas = this.likedChartRef()?.nativeElement;
    if (likedCanvas) {
      const items = this.getDistributionItems('q6Liked');
      this.charts.push(new Chart(likedCanvas, {
        type: 'polarArea',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: ['#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6'].map(c => c + 'cc'),
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }));
    }

    // Improvements Chart (Bar)
    const improvementsCanvas = this.improvementsChartRef()?.nativeElement;
    if (improvementsCanvas) {
      const items = this.getDistributionItems('q7Improvements');
      this.charts.push(new Chart(improvementsCanvas, {
        type: 'bar',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: '#f59e0b',
            borderRadius: 4,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true } }
        }
      }));
    }

    // Recommend Chart (Pie)
    const recommendCanvas = this.recommendChartRef()?.nativeElement;
    if (recommendCanvas) {
      const items = this.getDistributionItems('q9Recommend');
      this.charts.push(new Chart(recommendCanvas, {
        type: 'pie',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }));
    }

    // Discovery Chart (Doughnut)
    const discoveryCanvas = this.discoveryChartRef()?.nativeElement;
    if (discoveryCanvas) {
      const items = this.getDistributionItems('q12Discovery');
      this.charts.push(new Chart(discoveryCanvas, {
        type: 'doughnut',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: ['#a855f7', '#8b5cf6', '#6366f1', '#4f46e5'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }));
    }

    // Country Chart (Doughnut)
    const countryCanvas = this.countryChartRef()?.nativeElement;
    if (countryCanvas) {
      const items = this.getDistributionItems('country');
      this.charts.push(new Chart(countryCanvas, {
        type: 'doughnut',
        data: {
          labels: items.map(i => i.label),
          datasets: [{
            data: items.map(i => i.count),
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      }));
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

  async downloadCSV() {
    this.downloadingCSV.set(true);
    try {
      const response = await api.survey.csv.get({ fetch: { redirect: 'follow' } });
      const blob = new Blob([response.data as any], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'surveys_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    } finally {
      this.downloadingCSV.set(false);
    }
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
