import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { HabitService } from '../Services/habit.service';
import { Habit } from '../Model/habit';
import { Subscription } from 'rxjs';

interface DayData {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  fullDate: string; // YYYY-MM-DD format for storage
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'] // Ensure you have a report.component.css file
})
export class ReportComponent implements OnInit, OnDestroy {
  allHabits: Habit[] = [];
  // FIX: Allow selectedHabitId to be number, null, or undefined to match habit.id
  selectedHabitId: number | null | undefined = null;
  selectedHabit: Habit | undefined;
  calendarDays: DayData[] = [];
  currentMonth: Date = new Date(); // Represents the month currently displayed in the calendar
  todayDateForComparison: Date = new Date(); // Fixed date for comparison (midnight today)

  private habitsSubscription: Subscription | undefined;

  constructor(private router: Router, private habitService: HabitService) {
    // Set todayDateForComparison to midnight for accurate day comparison
    this.todayDateForComparison.setHours(0, 0, 0, 0);
  }

  ngOnInit(): void {
    // Subscribe to habit changes from the service
    this.habitsSubscription = this.habitService.habits$.subscribe(habits => {
      this.allHabits = habits;
      console.log('ReportComponent: Habits updated:', this.allHabits);

      // Logic to select a habit if none is selected or if the current selection is invalid
      if (this.allHabits.length > 0) {
        // If selectedHabitId is null/undefined OR if the selected habit no longer exists
        if (this.selectedHabitId === null || this.selectedHabitId === undefined ||
            !this.allHabits.find(h => h.id === this.selectedHabitId)) {
          // Default to the first habit's ID. This will now be compatible as selectedHabitId can be undefined.
          this.selectedHabitId = this.allHabits[0].id;
          console.log('ReportComponent: Defaulting selected habit to:', this.selectedHabitId);
        }
      } else {
        // No habits available, clear selection
        this.selectedHabitId = null;
        console.log('ReportComponent: No habits available, clearing selection.');
      }

      this.setSelectedHabit(); // Update the selectedHabit object based on selectedHabitId
      this.generateCalendar(this.currentMonth.getFullYear(), this.currentMonth.getMonth());
    });

    // Load habits from the backend. The subscription above will handle updates.
    this.habitService.loadHabits().subscribe({
      next: () => {
        console.log('ReportComponent: loadHabits call completed.');
      },
      error: (err) => console.error('Error loading habits in Report Component:', err)
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks when the component is destroyed
    if (this.habitsSubscription) {
      this.habitsSubscription.unsubscribe();
    }
  }

  /**
   * Sets the `selectedHabit` object based on `selectedHabitId`.
   * This is called whenever habit data changes or selection changes.
   */
  setSelectedHabit(): void {
    if (this.selectedHabitId !== null && this.selectedHabitId !== undefined) {
      this.selectedHabit = this.allHabits.find(h => h.id === this.selectedHabitId);
      console.log('ReportComponent: Selected habit object:', this.selectedHabit?.name || 'Not found');
    } else {
      this.selectedHabit = undefined; // No habit selected
      console.log('ReportComponent: selectedHabit is undefined (no habit selected).');
    }
  }

  /**
   * Handles changes in the habit selection dropdown.
   * @param event The change event from the select element.
   */
  onHabitSelectionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedValue = selectElement.value;

    if (selectedValue === 'null' || selectedValue === '') {
      this.selectedHabitId = null;
    } else {
      const parsedId = Number(selectedValue);
      this.selectedHabitId = isNaN(parsedId) ? null : parsedId; // Ensure it's null for invalid parsing
    }
    this.setSelectedHabit(); // Update the displayed habit
    this.generateCalendar(this.currentMonth.getFullYear(), this.currentMonth.getMonth()); // Re-generate calendar for new habit
    console.log('ReportComponent: Habit selection changed to ID:', this.selectedHabitId);
  }

  /**
   * Generates the calendar grid for a given year and month.
   * @param year The year for the calendar.
   * @param month The month (0-indexed) for the calendar.
   */
  generateCalendar(year: number, month: number): void {
    this.calendarDays = [];
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0); // Last day of current month
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)

    // Add days from the previous month to fill the first week of the grid
    const prevMonthLastDay = new Date(year, month, 0).getDate(); // Last day of previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      this.calendarDays.push({
        date: date,
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.todayDateForComparison),
        fullDate: this.formatDateForStorage(date)
      });
    }

    // Add days for the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        date: date,
        dayOfMonth: i,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, this.todayDateForComparison),
        fullDate: this.formatDateForStorage(date)
      });
    }

    // Add days from the next month to fill the grid (total 42 cells for 6 rows of 7 days)
    let totalDaysInGrid = this.calendarDays.length;
    let daysToFill = 42 - totalDaysInGrid;
    for (let i = 1; i <= daysToFill; i++) {
      const date = new Date(year, month + 1, i);
      this.calendarDays.push({
        date: date,
        dayOfMonth: i,
        isCurrentMonth: false,
        isToday: this.isSameDay(date, this.todayDateForComparison),
        fullDate: this.formatDateForStorage(date)
      });
    }
    console.log('ReportComponent: Calendar generated for', this.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
  }

  /**
   * Navigates the calendar to the previous or next month.
   * @param offset -1 for previous month, 1 for next month.
   */
  navigateMonth(offset: number): void {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + offset);
    this.generateCalendar(this.currentMonth.getFullYear(), this.currentMonth.getMonth());
    console.log('ReportComponent: Navigated to month:', this.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));
  }

  /**
   * Compares two Date objects to see if they represent the same day (ignoring time).
   * @param d1 First Date object.
   * @param d2 Second Date object.
   * @returns True if they are the same day, false otherwise.
   */
  isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Formats a Date object into a YYYY-MM-DD string for storage.
   * @param date The Date object to format.
   * @returns Formatted date string.
   */
  formatDateForStorage(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Calculates the completion percentage for a given habit.
   * @param habitId The ID of the habit.
   * @returns The completion percentage (rounded to nearest integer).
   */
  getHabitCompletionPercentage(habitId: number): number {
    const habit = this.allHabits.find(h => h.id === habitId);
    if (!habit || !habit.creationDate) return 0;

    const creationDate = new Date(habit.creationDate);
    // Ensure creationDate is at midnight for consistent calculation
    creationDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalDaysSinceCreation = 0;
    let tempDate = new Date(creationDate);
    // Loop through each day from creation to today (inclusive)
    while (tempDate.getTime() <= today.getTime()) {
        totalDaysSinceCreation++;
        tempDate.setDate(tempDate.getDate() + 1); // Move to the next day
    }

    if (totalDaysSinceCreation === 0) return 0; // Avoid division by zero

    const completedDays = habit.completions.length;
    return Math.round((completedDays / totalDaysSinceCreation) * 100);
  }

  /**
   * Checks if a habit was completed on a specific day.
   * @param habitId The ID of the habit.
   * @param dateString The date in YYYY-MM-DD format.
   * @returns True if completed, false otherwise.
   */
  habitCompletedOnDay(habitId: number, dateString: string): boolean {
    const habit = this.allHabits.find(h => h.id === habitId);
    return habit ? habit.completions.includes(dateString) : false;
  }

  /**
   * Gets the total number of days a habit has been marked completed.
   * @param habitId The ID of the habit.
   * @returns The count of completed days.
   */
  getDaysCompleted(habitId: number): number {
    const habit = this.allHabits.find(h => h.id === habitId);
    return habit ? habit.completions.length : 0;
  }

  /**
   * Calculates the number of days a habit was missed since its creation.
   * @param habitId The ID of the habit.
   * @returns The count of missed days.
   */
  getDaysMissed(habitId: number): number {
    const habit = this.allHabits.find(h => h.id === habitId);
    if (!habit || !habit.creationDate) return 0;

    const creationDate = new Date(habit.creationDate);
    creationDate.setHours(0,0,0,0); // Midnight for comparison

    const today = new Date();
    today.setHours(0,0,0,0); // Midnight for comparison

    let totalDaysSinceCreation = 0;
    let tempDate = new Date(creationDate);

    while(tempDate.getTime() <= today.getTime()){ // Iterate up to and including today
        totalDaysSinceCreation++;
        tempDate.setDate(tempDate.getDate() + 1);
    }
    return totalDaysSinceCreation - this.getDaysCompleted(habitId);
  }

  /**
   * Calculates the current consecutive streak for a habit.
   * @param habitId The ID of the habit.
   * @returns The current streak length.
   */
  getCurrentStreak(habitId: number): number {
    const habit = this.allHabits.find(h => h.id === habitId);
    if (!habit || !habit.completions || habit.completions.length === 0) return 0;

    // Convert completion dates to Date objects and sort them
    const completedDates = habit.completions
        .map(dateStr => {
            const d = new Date(dateStr);
            d.setHours(0, 0, 0, 0); // Normalize to midnight
            return d;
        })
        .sort((a, b) => a.getTime() - b.getTime()); // Sort ascending

    let streak = 0;
    let checkDate = new Date(); // Start checking from today
    checkDate.setHours(0, 0, 0, 0); // Normalize to midnight

    // Check if today is completed
    const isTodayCompleted = completedDates.some(d => this.isSameDay(d, checkDate));

    if (isTodayCompleted) {
        streak = 1;
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
    } else {
        // If today is not completed, check if yesterday was completed
        checkDate.setDate(checkDate.getDate() - 1); // Move to yesterday
        const isYesterdayCompleted = completedDates.some(d => this.isSameDay(d, checkDate));
        if (!isYesterdayCompleted) {
            // If neither today nor yesterday was completed, streak is 0.
            return 0;
        } else {
            // If yesterday was completed, the streak starts from yesterday.
            streak = 1;
            checkDate.setDate(checkDate.getDate() - 1); // Move to the day before yesterday
        }
    }

    // Continue checking backwards for consecutive days
    while (true) {
        const dateFound = completedDates.some(d => this.isSameDay(d, checkDate));
        if (dateFound) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1); // Move to the previous day
        } else {
            // Streak broken
            break;
        }
    }
    return streak;
  }

  /**
   * Navigates back to the dashboard.
   */
  goToDashboard(): void {
    this.router.navigate(['/home']);
  }
}
