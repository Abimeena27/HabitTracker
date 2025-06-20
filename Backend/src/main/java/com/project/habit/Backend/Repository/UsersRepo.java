package com.project.habit.Backend.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.habit.Backend.Model.Users;

import java.util.Optional; // Import Optional for find methods

@Repository
public interface UsersRepo extends JpaRepository<Users, Long> {

    Optional<Users> findByUsername(String username);

    Boolean existsByUsername(String username);

    <S extends Users> S save(S entity);
}
