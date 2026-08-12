package com.flowmail.calendar.repository;

import com.flowmail.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserIdAndStartTimeBetweenOrderByStartTimeAsc(
            Long userId, LocalDateTime from, LocalDateTime to);

    @Query("""
            SELECT e FROM CalendarEvent e
            WHERE e.userId = :userId
              AND e.startTime >= :from
              AND e.startTime <= :to
              AND e.status != 'CANCELLED'
            ORDER BY e.startTime ASC
            """)
    List<CalendarEvent> findActiveEvents(@Param("userId") Long userId,
                                          @Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);
}
