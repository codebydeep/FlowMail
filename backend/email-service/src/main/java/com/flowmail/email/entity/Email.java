package com.flowmail.email.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Email {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thread_id")
    private Long threadId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "external_message_id", nullable = false, unique = true)
    private String externalMessageId;

    @Column(name = "sender_email", nullable = false)
    private String senderEmail;

    @Column(name = "sender_name")
    private String senderName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> recipients;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> cc;

    @Column(length = 1000)
    private String subject;

    @Column(name = "body_plain", columnDefinition = "LONGTEXT")
    private String bodyPlain;

    @Column(name = "body_html", columnDefinition = "LONGTEXT")
    private String bodyHtml;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt;

    @Column(name = "is_read")
    private boolean read;

    @Column(name = "is_starred")
    private boolean starred;

    @Column(name = "is_archived")
    private boolean archived;

    @Column(name = "is_trashed")
    private boolean trashed;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
