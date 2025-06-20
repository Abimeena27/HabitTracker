import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { ReportComponent } from './report/report.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent},
  { path: 'report', component: ReportComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: '**', redirectTo: '/login' } 
];
