import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal(false);
  private isInitializedSignal = signal(false);

  isAuthenticated = this.isAuthenticatedSignal.asReadonly();
  isInitialized = this.isInitializedSignal.asReadonly();

  private baseUrl = environment.apiUrl.replace('/api', '');
  private initPromise: Promise<void> | null = null;

  constructor(private router: Router) {
    this.initPromise = this.checkAuthStatus();
  }

  waitForInit(): Promise<void> {
    return this.initPromise || Promise.resolve();
  }

  private async checkAuthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/get-session`, {
        credentials: 'include',
      });
      const data = await response.json();
      this.isAuthenticatedSignal.set(!!data?.session);
    } catch {
      this.isAuthenticatedSignal.set(false);
    } finally {
      this.isInitializedSignal.set(true);
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Invalid credentials' };
      }

      this.isAuthenticatedSignal.set(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseUrl}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors
    }
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }
}
