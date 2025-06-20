package com.project.habit.Backend.Service;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections; // For simple authorities
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.project.habit.Backend.Model.Users;

// This class is a custom implementation of Spring Security's UserDetails interface.
// It adapts your application's User entity to the format Spring Security expects.
// IMPORTANT: It MUST implement java.io.Serializable for Spring Security to store it
// correctly in the HTTP session across requests.
public class UserDetailsImpl implements UserDetails, Serializable {

    // Recommended: Add a serialVersionUID for versioning.
    // This helps with version control during deserialization.
    private static final long serialVersionUID = 1L;

    // Fields to store user information necessary for authentication and authorization.
    // These typically mirror relevant fields from your User entity.
    private Long id;
    private String username;
    private String password; // This will store the hashed password

    // Constructor to create UserDetailsImpl from your application's User entity.
    public UserDetailsImpl(Users user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword(); // Assuming User.getPassword() returns the hashed password
    }

    // Default constructor is often required by Spring Security's deserialization process
    // when loading UserDetails from the session.
    public UserDetailsImpl() {}

    // --- UserDetails Interface Implementations ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // For simplicity in this application, we are returning an empty list of authorities.
        // In a real-world scenario, this would return the user's roles (e.g., "ROLE_USER", "ROLE_ADMIN").
        return Collections.emptyList();
    }

    @Override
    public String getPassword() {
        return password; // Returns the user's hashed password
    }

    @Override
    public String getUsername() {
        return username; // Returns the user's username
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Indicates if the user's account has expired. 'true' means it has not expired.
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Indicates if the user is locked or unlocked. 'true' means it is not locked.
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Indicates if the user's credentials (password) have expired. 'true' means they have not expired.
    }

    @Override
    public boolean isEnabled() {
        return true; // Indicates if the user is enabled or disabled. 'true' means enabled.
    }

    // Custom getter for the user ID, which is often useful in your application logic.
    public Long getId() {
        return id;
    }
}
