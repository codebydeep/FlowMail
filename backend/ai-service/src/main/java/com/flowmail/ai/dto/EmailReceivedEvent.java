package com.flowmail.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String bodyPlain;
    private LocalDateTime receivedAt;
}
