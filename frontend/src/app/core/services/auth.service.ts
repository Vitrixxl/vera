import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal(false);
  isAuthenticated = this.isAuthenticatedSignal.asReadonly();

  constructor(private router: Router) {
    // TODO: Check Better Auth session on init
    this.checkAuthStatus();
  }

  private checkAuthStatus() {
    // TODO: Implement Better Auth session check
    // For now, check localStorage or session
    const token = localStorage.getItem('auth_token');
    this.isAuthenticatedSignal.set(!!token);
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      // TODO: Implement Better Auth login
      console.log('Login with Better Auth:', email);

      // Simulate login for now
      localStorage.setItem('auth_token', 'dummy_token');
      this.isAuthenticatedSignal.set(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout() {
    // TODO: Implement Better Auth logout
    localStorage.removeItem('auth_token');
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }
}
