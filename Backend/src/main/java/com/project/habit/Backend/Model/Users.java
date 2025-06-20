package com.project.habit.Backend.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.io.Serializable; // Import Serializable

// Marks this class as a JPA entity, mapped to a database table named "users"
@Entity
@Table(name = "users",
       uniqueConstraints = {
           @UniqueConstraint(columnNames = "username") // Ensures usernames are unique
       })
public class Users implements Serializable { // CRITICAL FIX: Implement Serializable

    // Recommended: Add a serialVersionUID for versioning
    private static final long serialVersionUID = 1L;

    @Id // Specifies the primary key of the entity
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Auto-generates the ID in the database
    private Long id;

    @Column(nullable = false, unique = true) // Column for username, cannot be null and must be unique
    private String username;

    @Column(nullable = false) // Column for password, cannot be null
    private String password;

    // Default constructor (required by JPA and Spring)
    public Users() {
    }

    // Constructor for creating a new User object
    public Users(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // --- Getters ---
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    // --- Setters ---
    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Optional: Override toString for better logging/debugging
    @Override
    public String toString() {
        return "User{" +
               "id=" + id +
               ", username='" + username + '\'' +
               // Do NOT include password in toString for security reasons in production
               '}';
    }
}
