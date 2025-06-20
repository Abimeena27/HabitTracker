package com.project.habit.Backend.Repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.habit.Backend.Model.Habits;
import com.project.habit.Backend.Model.Users;

import java.util.List;
import java.util.Optional;

@Repository
public interface HabitsRepo extends JpaRepository<Habits, Long> {

    List<Habits> findByUser(Users user);

    Optional<Habits> findByIdAndUser(Long id, Users user);
}

