package com.project.habit.Backend.Service;
import com.project.habit.Backend.Model.Habits;
import com.project.habit.Backend.Model.Users;
import com.project.habit.Backend.Repository.HabitsRepo;
import com.project.habit.Backend.Repository.UsersRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class HabitsService {

    @Autowired
    private HabitsRepo habitRepository;

    @Autowired
    private UsersRepo usersRepo;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    @Transactional
    public Habits createHabit(Habits habit, String username) {
        Users user = usersRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        habit.setUser(user);
        habit.setCompleted(false);
        habit.setCreationDate(LocalDate.now().format(DATE_FORMATTER));
        return habitRepository.save(habit);
    }

    public List<Habits> getAllHabitsForUser(String username) {
        Users user = usersRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return habitRepository.findByUser(user);
    }

    public Optional<Habits> getHabitByIdForUser(Long habitId, String username) {
        Users user = usersRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
        return habitRepository.findByIdAndUser(habitId, user);
    }

    @Transactional
    public Habits updateHabit(Long habitId, Habits updatedHabit, String username) {
        return getHabitByIdForUser(habitId, username).map(existingHabit -> {
            existingHabit.setName(updatedHabit.getName());
            existingHabit.setCompleted(updatedHabit.isCompleted());
            existingHabit.setCompletions(updatedHabit.getCompletions());
            return habitRepository.save(existingHabit);
        }).orElse(null);
    }

    @Transactional
    public boolean deleteHabit(Long habitId, String username) {
        return getHabitByIdForUser(habitId, username).map(habit -> {
            habitRepository.delete(habit);
            return true;
        }).orElse(false);
    }

    @Transactional
    public Habits markHabitAsCompletedToday(Long habitId, String username) {
        return getHabitByIdForUser(habitId, username).map(habit -> {
            String today = LocalDate.now().format(DATE_FORMATTER);
            if (!habit.getCompletions().contains(today)) {
                habit.getCompletions().add(today);
            }
            habit.setCompleted(true);
            return habitRepository.save(habit);
        }).orElse(null);
    }

    @Transactional
    public Habits markHabitAsNotCompletedToday(Long habitId, String username) {
        return getHabitByIdForUser(habitId, username).map(habit -> {
            String today = LocalDate.now().format(DATE_FORMATTER);
            habit.getCompletions().remove(today);
            habit.setCompleted(false);
            return habitRepository.save(habit);
        }).orElse(null);
    }

    public boolean check7DayConsecutiveStreak(Habits habit, String referenceDate) {
        if (habit == null || habit.getCompletions() == null || habit.getCompletions().isEmpty()) {
            return false;
        }

        Set<LocalDate> completedDates = habit.getCompletions().stream()
                .map(dateStr -> LocalDate.parse(dateStr, DATE_FORMATTER))
                .collect(Collectors.toSet());

        LocalDate currentCheckDate = LocalDate.parse(referenceDate, DATE_FORMATTER);

        if (!completedDates.contains(currentCheckDate)) {
            return false;
        }

        int streakCount = 0;
        for (int i = 0; i < 7; i++) {
            LocalDate dateToCheck = currentCheckDate.minusDays(i);
            if (completedDates.contains(dateToCheck)) {
                streakCount++;
            } else {
                return false;
            }
        }

        return streakCount >= 7;
    }

    public int calculateCurrentStreak(Habits habit) {
        if (habit == null || habit.getCompletions() == null || habit.getCompletions().isEmpty()) {
            return 0;
        }

        Set<LocalDate> completedDates = habit.getCompletions().stream()
                .map(dateStr -> LocalDate.parse(dateStr, DATE_FORMATTER))
                .collect(Collectors.toSet());

        LocalDate currentCheckDate = LocalDate.now();
        int streak = 0;

        if (!completedDates.contains(currentCheckDate)) {
            currentCheckDate = currentCheckDate.minusDays(1);
        } else {
            streak = 1;
            currentCheckDate = currentCheckDate.minusDays(1);
        }

        while (completedDates.contains(currentCheckDate)) {
            streak++;
            currentCheckDate = currentCheckDate.minusDays(1);
        }

        return streak;
    }
}
