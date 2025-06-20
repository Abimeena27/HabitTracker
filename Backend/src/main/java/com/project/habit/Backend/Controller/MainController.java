package com.project.habit.Backend.Controller;

import com.project.habit.Backend.Model.Habits;
import com.project.habit.Backend.Model.Users;
import com.project.habit.Backend.Service.HabitsService;
import com.project.habit.Backend.Service.UsersService;
import jakarta.servlet.http.HttpServletRequest; // Import HttpServletRequest
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:4200", maxAge = 3600)
@RestController
@RequestMapping("/api")
public class MainController {

    @Autowired
    private UsersService userService;

    @Autowired
    private HabitsService habitService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/auth/register")
    public ResponseEntity<String> registerUser(@RequestBody Users user) {
        try {
            userService.registerUser(user.getUsername(), user.getPassword());
            return ResponseEntity.ok("User registered successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/auth/login")
    public ResponseEntity<String> authenticateUser(@RequestBody Users user, HttpServletRequest request) { // Added HttpServletRequest
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));

            // Explicitly get or create session before setting context
            // This ensures a session is active and available for SecurityContextPersistenceFilter
            request.getSession(true);

            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            return ResponseEntity.ok("User logged in successfully! Username: " + userDetails.getUsername());

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error: Invalid username or password!");
        }
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("User is not authenticated.");
        }
        // Assuming your UserDetailsImpl provides the username directly
        // If your UserDetailsImpl has a different way to get username, adjust this.
        return ((UserDetails) authentication.getPrincipal()).getUsername();
    }

    @PostMapping("/habits")
    public ResponseEntity<String> createHabit(@RequestBody Habits habit) {
        try {
            String username = getCurrentUsername();
            habitService.createHabit(habit, username);
            return new ResponseEntity<>("Habit created successfully!", HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating habit: " + e.getMessage());
        }
    }

    @GetMapping("/habits")
    public ResponseEntity<?> getAllHabits() {
        try {
            String username = getCurrentUsername();
            List<Habits> habits = habitService.getAllHabitsForUser(username);
            return ResponseEntity.ok(habits);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving habits: " + e.getMessage());
        }
    }

    @GetMapping("/habits/{id}")
    public ResponseEntity<?> getHabitById(@PathVariable Long id) {
        try {
            String username = getCurrentUsername();
            Optional<Habits> habit = habitService.getHabitByIdForUser(id, username);
            return habit.map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving habit: " + e.getMessage());
        }
    }

    @PutMapping("/habits/{id}")
    public ResponseEntity<String> updateHabit(@PathVariable Long id, @RequestBody Habits habit) {
        try {
            String username = getCurrentUsername();
            Habits updatedHabit = habitService.updateHabit(id, habit, username);
            if (updatedHabit != null) {
                return ResponseEntity.ok("Habit updated successfully!");
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating habit: " + e.getMessage());
        }
    }

    @DeleteMapping("/habits/{id}")
    public ResponseEntity<String> deleteHabit(@PathVariable Long id) {
        try {
            String username = getCurrentUsername();
            if (habitService.deleteHabit(id, username)) {
                return ResponseEntity.ok("Habit deleted successfully!");
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting habit: " + e.getMessage());
        }
    }

    @PostMapping("/habits/{id}/complete")
    public ResponseEntity<String> markHabitCompleted(@PathVariable Long id) {
        try {
            String username = getCurrentUsername();
            Habits updatedHabit = habitService.markHabitAsCompletedToday(id, username);
            if (updatedHabit != null) {
                return ResponseEntity.ok("Habit marked completed for today!");
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error marking habit complete: " + e.getMessage());
        }
    }

    @PostMapping("/habits/{id}/uncomplete")
    public ResponseEntity<String> markHabitUncompleted(@PathVariable Long id) {
        try {
            String username = getCurrentUsername();
            Habits updatedHabit = habitService.markHabitAsNotCompletedToday(id, username);
            if (updatedHabit != null) {
                return ResponseEntity.ok("Habit marked uncompleted for today!");
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error marking habit uncomplete: " + e.getMessage());
        }
    }

    @GetMapping("/habits/{id}/streak")
    public ResponseEntity<String> getHabitStreak(@PathVariable Long id) {
        try {
            String username = getCurrentUsername();
            Optional<Habits> habitOptional = habitService.getHabitByIdForUser(id, username);
            return habitOptional.map(habit -> {
                int currentStreak = habitService.calculateCurrentStreak(habit);
                boolean has7DayStreak = habitService.check7DayConsecutiveStreak(habit, LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE));
                return ResponseEntity.ok(String.format("Current streak: %d days. Has 7-day streak: %b", currentStreak, has7DayStreak));
            }).orElseGet(() -> ResponseEntity.notFound().build());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error checking habit streak: " + e.getMessage());
        }
    }
}
