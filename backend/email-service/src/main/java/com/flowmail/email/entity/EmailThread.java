package com.flowmail.email.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_threads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "external_thread_id", nullable = false)
    private String externalThreadId;

    @Column(length = 1000)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String snippet;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "unread_count")
    private int unreadCount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
