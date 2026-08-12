package com.flowmail.ai.repository;

import com.flowmail.ai.model.EmailAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmailAnalysisRepository extends JpaRepository<EmailAnalysis, Long> {

    Optional<EmailAnalysis> findByEmailId(Long emailId);

    List<EmailAnalysis> findByUserIdAndRequiresActionTrueOrderByAnalyzedAtDesc(Long userId);

    @Query("SELECT a FROM EmailAnalysis a WHERE a.userId = :userId AND a.priority = 'HIGH' ORDER BY a.analyzedAt DESC")
    List<EmailAnalysis> findHighPriorityByUserId(@Param("userId") Long userId);
}
