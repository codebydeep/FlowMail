package com.flowmail.email.repository;

import com.flowmail.email.entity.EmailThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailThreadRepository extends JpaRepository<EmailThread, Long> {

    Page<EmailThread> findByUserIdOrderByLastMessageAtDesc(Long userId, Pageable pageable);

    Optional<EmailThread> findByUserIdAndExternalThreadId(Long userId, String externalThreadId);
}
