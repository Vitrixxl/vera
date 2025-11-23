import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">Vera</h1>
        <p class="text-xl text-gray-600 mb-8">Welcome to Vera Survey Platform</p>
        <div class="w-16 h-1 bg-indigo-600 mx-auto"></div>
      </div>
    </div>
  `
})
export class LandingComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    // Redirect to chat after 2 seconds
    setTimeout(() => {
      this.router.navigate(['/chat']);
    }, 2000);
  }
}
