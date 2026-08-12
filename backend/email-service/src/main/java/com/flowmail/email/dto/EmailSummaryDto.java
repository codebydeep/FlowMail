package com.flowmail.email.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class EmailSummaryDto {
    private Long id;
    private String senderEmail;
    private String senderName;
    private String subject;
    private String snippet;
    private LocalDateTime receivedAt;
    private boolean read;
    private boolean starred;
    // AI classification — populated from a join or separate call
    private String priority;    // HIGH / MEDIUM / LOW
    private String intent;      // MEETING_REQUEST / ACTION_REQUIRED / FYI / etc.
    private boolean requiresAction;
}
