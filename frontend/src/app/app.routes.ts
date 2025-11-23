import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { ChatComponent } from './features/chat/chat.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SurveyComponent } from './features/survey/survey.component';
import { SurveyDoneComponent } from './features/survey/survey-done.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'survey', component: SurveyComponent },
  { path: 'survey/done', component: SurveyDoneComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: '' }
];
