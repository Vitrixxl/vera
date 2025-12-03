import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: `./login.component.html`,
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private router: Router, private authService: AuthService) {}

  async handleLogin() {
    this.errorMessage.set('');

    if (!this.email || !this.password) {
      this.errorMessage.set('Merci de remplir les champs');
      return;
    }

    this.isLoading.set(true);

    const result = await this.authService.login(this.email, this.password);

    this.isLoading.set(false);

    if (result.success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage.set(result.error || 'Connexion echoué');
    }
  }
}
