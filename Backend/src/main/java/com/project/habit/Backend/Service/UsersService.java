package com.project.habit.Backend.Service;

import com.project.habit.Backend.Model.Users;

import com.project.habit.Backend.Repository.UsersRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList; // No longer needed if not using default UserDetails constructor
import java.util.Optional;

@Service
public class UsersService implements UserDetailsService {

    @Autowired
    UsersRepo usersRepo;

    // This method is part of the UserDetailsService interface.
    // Spring Security calls this method to load user details during authentication.
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users user = usersRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username));

        // CRITICAL FIX: Return your custom UserDetailsImpl instance.
        // This UserDetailsImpl class MUST implement java.io.Serializable.
        return new UserDetailsImpl(user);
    }

    @Transactional
    public Users registerUser(String username, String password) {
        if (usersRepo.existsByUsername(username)) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        // Removed password encoding as requested (STILL NOT RECOMMENDED for production)
        Users newUser = new Users(username, password); // Password stored directly (INSECURE)

        return usersRepo.save(newUser);
    }

    public Optional<Users> findByUsername(String username) {
        return usersRepo.findByUsername(username);
    }

    public Optional<Users> findById(Long userId) {
        return usersRepo.findById(userId);
    }
}
