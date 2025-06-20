import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Necessary for *ngIf, *ngTemplate, *ngContainer

import { AuthService } from '../Services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  // Login form properties
  username: string = '';
  password: string = '';

  // Sign up form properties
  signupUsername: string = ''; // New
  signupPassword: string = ''; // New

  errorMessage: string = '';
  successMessage: string = '';
  isLoginMode: boolean = true; // Controls which side of the card is visible

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  // Handles LOGIN form submission
  signIn(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/home']);
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
      },
      error: (err) => {
        this.errorMessage = err.error || 'An unexpected error occurred during login.';
        console.error('Login error:', err);
      }
    });
  }

  // Handles SIGN UP form submission (new method)
  registerUser(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.signupUsername, this.signupPassword).subscribe({
      next: (response) => {
        this.successMessage = 'Registration successful! You can now log in.';
        this.isLoginMode = true; // Flip back to login mode after successful registration
        this.signupUsername = ''; // Clear signup fields
        this.signupPassword = ''; // Clear signup fields
      },
      error: (err) => {
        this.errorMessage = err.error || 'An unexpected error occurred during registration.';
        console.error('Registration error:', err);
      }
    });
  }

  /**
   * Toggles the mode and flips the card.
   */
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode; // Flip the flag
    this.errorMessage = '';               // Clear messages when switching modes
    this.successMessage = '';             // Clear messages when switching modes
    this.username = '';                   // Clear login fields
    this.password = '';                   // Clear login fields
    this.signupUsername = '';             // Clear signup fields
    this.signupPassword = '';             // Clear signup fields
  }
}