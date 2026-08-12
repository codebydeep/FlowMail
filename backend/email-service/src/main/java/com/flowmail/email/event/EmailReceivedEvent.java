package com.flowmail.email.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Published to Kafka topic "email.received" when a new email arrives.
 * Consumed by ai-service for classification and notification-service for push.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailReceivedEvent {
    private String eventId;
    private Long emailId;
    private Long userId;
    private String senderEmail;
    private String subject;
    private String bodyPlain;   // AI needs body text
    private LocalDateTime receivedAt;
}
