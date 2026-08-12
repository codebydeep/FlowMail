package com.flowmail.email.repository;

import com.flowmail.email.entity.Email;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmailRepository extends JpaRepository<Email, Long> {

    Page<Email> findByUserIdAndArchivedFalseAndTrashedFalseOrderByReceivedAtDesc(Long userId, Pageable pageable);

    Page<Email> findByUserIdAndReadFalseAndArchivedFalseOrderByReceivedAtDesc(Long userId, Pageable pageable);

    Page<Email> findByThreadIdOrderByReceivedAtAsc(Long threadId, Pageable pageable);

    Optional<Email> findByExternalMessageId(String externalMessageId);

    long countByUserIdAndReadFalseAndArchivedFalse(Long userId);

    // MySQL FULLTEXT search
    @Query(value = """
            SELECT * FROM emails
            WHERE user_id = :userId
              AND archived = false
              AND trashed = false
              AND MATCH(subject, body_plain) AGAINST(:query IN BOOLEAN MODE)
            ORDER BY received_at DESC
            """, nativeQuery = true)
    Page<Email> fulltextSearch(@Param("userId") Long userId,
                               @Param("query") String query,
                               Pageable pageable);
}
