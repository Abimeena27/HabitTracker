package com.project.habit.Backend.Model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.FetchType; // Import FetchType for ManyToOne

import java.util.ArrayList;
import java.util.List;

// Marks this class as a JPA entity, mapped to a database table named "habits"
@Entity
@Table(name = "habits")
public class Habits {

    @Id // Specifies the primary key of the entity
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates the ID in the database
    private Long id;

    @Column(nullable = false) // Column for habit name, cannot be null
    private String name;

    // This field represents if the habit is completed for the current day.
    // It can be updated by client-side logic based on if today's date is in the completions list.
    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false) // Stores the date the habit was created (e.g., "YYYY-MM-DD")
    private String creationDate;

    // @ElementCollection is used for collections of basic types.
    // It tells JPA to store this list in a separate table (habit_completions).
    // Each entry in the list will be a string representing a completion date (e.g., "YYYY-MM-DD").
    @ElementCollection(fetch = FetchType.EAGER) // Eagerly load completions with the habit
    @CollectionTable(name = "habit_completions", // Name of the table to store completions
                     joinColumns = @JoinColumn(name = "habit_id")) // Foreign key column in habit_completions table
    @Column(name = "completion_date") // Column name for the date string in habit_completions table
    private List<String> completions = new ArrayList<>(); // List to store dates of completion

    @ManyToOne(fetch = FetchType.LAZY) // Many habits can belong to one user
    @JoinColumn(name = "user_id", nullable = false) // Foreign key column in the 'habits' table linking to 'users' table
    private Users user; // The User who owns this habit

    // Default constructor (required by JPA and Spring)
    public Habits() {
    }

    // Constructor for creating a new Habit object
    public Habits(String name, boolean completed, String creationDate, Users user) {
        this.name = name;
        this.completed = completed;
        this.creationDate = creationDate;
        this.user = user;
        // The completions list will be initialized as empty by default due to ArrayList<>();
    }

    // --- Getters ---
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isCompleted() {
        return completed;
    }

    public String getCreationDate() {
        return creationDate;
    }

    public List<String> getCompletions() {
        return completions;
    }

    public Users getUser() {
        return user;
    }

    // --- Setters ---
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public void setCreationDate(String creationDate) {
        this.creationDate = creationDate;
    }

    public void setCompletions(List<String> completions) {
        this.completions = completions;
    }

    public void setUser(Users user) {
        this.user = user;
    }

    // Optional: Override toString for better logging/debugging
    @Override
    public String toString() {
        return "Habit{" +
               "id=" + id +
               ", name='" + name + '\'' +
               ", completed=" + completed +
               ", creationDate='" + creationDate + '\'' +
               ", completions=" + completions +
               ", userId=" + (user != null ? user.getId() : "null") +
               '}';
    }
}
