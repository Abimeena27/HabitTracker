import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

  private _currentUser = new BehaviorSubject<string | null>(null);
  public currentUser: Observable<string | null> = this._currentUser.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const storedUsername = localStorage.getItem('currentUser');
      if (storedUsername) {
        this._currentUser.next(storedUsername);
      }
    }
  }

  // --- REAL REGISTER METHOD ---
  register(username: string, password: string): Observable<string> { // Expecting string response
    const registerRequest = { username, password };

    return this.http.post(`${this.apiUrl}/register`, registerRequest, { // Corrected /signup to /register
      withCredentials: true,
      responseType: 'text' // <--- CRUCIAL: Tell HttpClient to expect plain text
    }).pipe(
      tap((response: string) => { // response is now a string
        console.log(`Registration successful for ${username}:`, response); // Log the raw string response
      }),
      catchError(error => {
        console.error('Registration failed:', error);
        let errorMessage = 'Registration failed. Please try again.';
        // If backend sends plain string for error.error, use it directly
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) { // Fallback to Angular's error message
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // --- REAL LOGIN METHOD ---
  login(username: string, password: string): Observable<boolean> {
    const loginRequest = { username, password };

    return this.http.post(`${this.apiUrl}/login`, loginRequest, {
      withCredentials: true,
      responseType: 'text' // <--- CRUCIAL: Tell HttpClient to expect plain text
    }).pipe(
      tap((response: string) => { // response is now a string
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('currentUser', username);
        }
        this._currentUser.next(username);
        console.log(`Login successful for ${username}:`, response); // Log the raw string response
      }),
      map(() => true),
      catchError(error => {
        console.error('Login failed:', error);
        let errorMessage = 'Login failed. Invalid username or password.';
        // If backend sends plain string for error.error, use it directly
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) { // Fallback to Angular's error message
          errorMessage = error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // --- REAL LOGOUT METHOD ---
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, {
      withCredentials: true,
      responseType: 'text' // Assuming logout also returns a plain string message
    }).pipe(
      tap(() => {
        console.log('Logout successful on backend.');
      }),
      catchError(error => {
        console.error('Logout failed on backend (might already be logged out):', error);
        // If backend sends plain string for error.error, use it directly
        let errorMessage = 'Logout failed.';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.message) { // Fallback to Angular's error message
          errorMessage = error.message;
        }
        // Even if the backend call fails, we should clear local state
        return of(errorMessage); // Return an observable of string for consistency
      })
    ).subscribe(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('currentUser');
      }
      this._currentUser.next(null);
      this.router.navigate(['/login']);
    });
  }

  // --- REMOVED: getJwtToken() ---
  // This method is no longer needed as we are using session-based authentication.
  // Make sure you remove any calls to this method in your components/guards.
}
