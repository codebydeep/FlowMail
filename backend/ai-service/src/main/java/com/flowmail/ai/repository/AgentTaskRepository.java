package com.flowmail.ai.repository;

import com.flowmail.ai.model.AgentTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AgentTaskRepository extends JpaRepository<AgentTask, Long> {

    List<AgentTask> findBySessionIdOrderByCreatedAtAsc(String sessionId);

    Optional<AgentTask> findTopByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, AgentTask.Status status);
}
