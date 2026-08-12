package com.flowmail.notification.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RealtimeNotification {
    private String type;   // NEW_EMAIL | AI_ANALYSIS_DONE | FOLLOW_UP_REMINDER
    private String title;
    private String body;
    private Object payload;
}
