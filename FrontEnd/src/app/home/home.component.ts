import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../Services/auth.service';
import { HabitService } from '../Services/habit.service';
import { Habit } from '../Model/habit';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  userName: string = 'Guest';
  currentDate: Date = new Date();
  newHabitName: string = '';
  showNewHabitAddedNotification: boolean = false;
  lastAddedHabitName: string = '';
  notificationTimeout: any;

  todayHabits: Habit[] = [];
  showEmptyState: boolean = true;

  private habitsSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private authService: AuthService,
    private habitService: HabitService
  ) { }

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser.subscribe(username => {
      if (username) {
        this.userName = username;
      } else {
        this.userName = 'Guest';
      }
    });

    this.habitsSubscription = this.habitService.habits$.subscribe(habits => {
      this.todayHabits = habits;
      this.showEmptyState = this.todayHabits.length === 0;
    });

    this.habitService.loadHabits().subscribe({
      next: () => {},
      error: (err) => console.error('Error loading habits in Home Component:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.habitsSubscription) {
      this.habitsSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  get completedHabitsCount(): number {
    return this.todayHabits.filter(habit => habit.completed).length;
  }

  get totalHabitsCount(): number {
    return this.todayHabits.length;
  }

  addHabit(): void {
    const trimmedHabitName = this.newHabitName.trim();
    if (trimmedHabitName) {
      this.habitService.addHabit(trimmedHabitName).subscribe({
        next: () => {
          this.lastAddedHabitName = trimmedHabitName;
          this.showNewHabitAddedNotification = true;

          if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
          }
          this.notificationTimeout = setTimeout(() => {
            this.showNewHabitAddedNotification = false;
          }, 4000);

          this.newHabitName = '';
        },
        error: (err) => alert('Error adding habit: ' + err.message)
      });
    } else {
      alert('Please enter a habit name.');
    }
  }

  toggleHabitCompletion(habit: Habit): void {
    if (habit.id !== undefined && habit.id !== null) {
      this.habitService.toggleHabitCompletion(habit.id).subscribe({
        next: () => {},
        error: (err) => alert('Error toggling habit completion: ' + err.message)
      });
    } else {
      console.error('Cannot toggle completion: Habit ID is undefined or null.', habit);
      alert('Cannot toggle completion for a habit without a valid ID.');
    }
  }

  editHabit(habit: Habit): void {
    const newName = prompt('Edit habit:', habit.name);
    if (newName !== null && newName.trim() !== '') {
      if (habit.id !== undefined && habit.id !== null) {
        this.habitService.updateHabit(habit.id, newName.trim()).subscribe({
          next: () => {},
          error: (err) => alert('Error updating habit: ' + err.message)
        });
      } else {
        console.error('Cannot edit: Habit ID is undefined or null.', habit);
        alert('Cannot edit a habit without a valid ID.');
      }
    }
  }

  deleteHabit(habitToDelete: Habit): void {
    if (confirm(`Are you sure you want to delete "${habitToDelete.name}"?`)) {
      if (habitToDelete.id !== undefined && habitToDelete.id !== null) {
        this.habitService.deleteHabit(habitToDelete.id).subscribe({
          next: () => {},
          error: (err) => alert('Error deleting habit: ' + err.message)
        });
      } else {
        console.error('Cannot delete: Habit ID is undefined or null.', habitToDelete);
        alert('Cannot delete a habit without a valid ID.');
      }
    }
  }

  goToWeeklyReport(): void {
    this.router.navigate(['/report']);
  }

  signOut(): void {
    this.authService.logout();
    // this.habitService.clearAllHabits(); // Commented out as this method is likely not in HabitService with a backend
    alert('Signing out. Local data cleared.');
    this.router.navigate(['/login']);
  }
}