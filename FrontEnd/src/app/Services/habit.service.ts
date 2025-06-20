import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Habit } from '../Model/habit';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HabitService {
  private _habits = new BehaviorSubject<Habit[]>([]);
  // FIX: Corrected typo from '_habils' to '_habits'
  public readonly habits$: Observable<Habit[]> = this._habits.asObservable();

  private apiUrl = 'http://localhost:8080/api/habits';

  constructor(private http: HttpClient) {
    // This is fine here. loadHabits() will be called after login/auth.
  }

  // Helper for API options when expecting a plain text response
  // Explicitly specify 'observe: 'body'' along with 'responseType: 'text''
  private getHttpTextOptions(): { withCredentials: true, responseType: 'text', observe: 'body' } {
    return {
      withCredentials: true,
      responseType: 'text', // Tells HttpClient to parse response as plain text
      observe: 'body'       // Tells HttpClient to return only the response body (as string)
    };
  }

  // Helper for API options when expecting a JSON response
  private getHttpJsonOptions(): { withCredentials: true } {
    return {
      withCredentials: true
    };
  }

  // Fetches all habits from the backend for the current user (expects JSON)
  loadHabits(): Observable<Habit[]> {
    return this.http.get<Habit[]>(this.apiUrl, this.getHttpJsonOptions()).pipe(
      tap(backendHabits => {
        const clientHabits = backendHabits.map(h => ({
          ...h,
          creationDate: h.creationDate
        }));
        this._habits.next(clientHabits);
        console.log('HabitService: Habits loaded from backend:', clientHabits);
      }),
      catchError(this.handleError)
    );
  }

  // Adds a new habit to the backend (expects string response)
  addHabit(name: string): Observable<string> {
    const newHabit: Habit = {
      name: name.trim(),
      completed: false,
      creationDate: this.getTodayDateString(),
      completions: []
    };

    // CRITICAL FIX: Removed the <string> generic type from http.post
    // responseType: 'text' in options is sufficient for HttpClient to infer the type.
    return this.http.post(this.apiUrl, newHabit, this.getHttpTextOptions()).pipe(
      tap((response: string) => { // 'response' will now be correctly typed as string
        console.log('HabitService: Add habit response from backend:', response);
        this.loadHabits().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // Toggles completion and updates habit on the backend (expects string response)
  toggleHabitCompletion(habitId: number): Observable<string> {
    const currentHabits = this._habits.getValue();
    const habitToUpdate = currentHabits.find(h => h.id === habitId);

    if (!habitToUpdate) {
      return throwError(() => new Error('Habit not found for toggling locally.'));
    }

    const todayDateString = this.getTodayDateString();
    const endpoint = habitToUpdate.completions.includes(todayDateString) ?
                     `${this.apiUrl}/${habitId}/uncomplete` :
                     `${this.apiUrl}/${habitId}/complete`;

    // CRITICAL FIX: Removed the <string> generic type from http.post
    return this.http.post(endpoint, {}, this.getHttpTextOptions()).pipe(
      tap((response: string) => {
        console.log(`HabitService: Toggled habit ID ${habitId} on backend:`, response);
        this.loadHabits().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // Updates an existing habit's name on the backend (expects string response)
  updateHabit(habitId: number, newName: string): Observable<string> {
    const currentHabits = this._habits.getValue();
    const habitToUpdate = currentHabits.find(h => h.id === habitId);

    if (!habitToUpdate || !newName.trim()) {
      return throwError(() => new Error('Habit not found or new name is empty.'));
    }

    const updatedHabit = { ...habitToUpdate, name: newName.trim() };

    // CRITICAL FIX: Removed the <string> generic type from http.put
    return this.http.put(this.apiUrl + '/' + habitId, updatedHabit, this.getHttpTextOptions()).pipe(
      tap((response: string) => {
        console.log(`HabitService: Updated habit ID ${habitId} on backend:`, response);
        this.loadHabits().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // Deletes a habit from the backend (expects string response)
  deleteHabit(habitId: number): Observable<string> {
    // CRITICAL FIX: Removed the <string> generic type from http.delete
    return this.http.delete(this.apiUrl + '/' + habitId, this.getHttpTextOptions()).pipe(
      tap((response: string) => {
        console.log(`HabitService: Deleted habit ID ${habitId} from backend:`, response);
        const currentHabits = this._habits.getValue();
        const updatedHabits = currentHabits.filter(h => h.id !== habitId);
        this._habits.next(updatedHabits);
      }),
      catchError(this.handleError)
    );
  }

  // Method to get habit streak (expects string response)
  getHabitStreak(habitId: number): Observable<string> {
    // CRITICAL FIX: Removed the <string> generic type from http.get
    return this.http.get(this.apiUrl + '/' + habitId + '/streak', this.getHttpTextOptions()).pipe(
      tap((response: string) => {
        console.log(`HabitService: Streak for habit ID ${habitId}:`, response);
      }),
      catchError(this.handleError)
    );
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (typeof ErrorEvent !== 'undefined' && error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (typeof error.error === 'string') {
      errorMessage = `Server returned code: ${error.status}, body was: ${error.error}`;
    } else if (error.message) {
      errorMessage = `Server returned code: ${error.status}, body was: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
