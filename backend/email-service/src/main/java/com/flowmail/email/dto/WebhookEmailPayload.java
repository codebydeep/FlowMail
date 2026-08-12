package com.flowmail.email.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Payload from the Integration Service after processing a Corsair webhook.
 */
@Data
public class WebhookEmailPayload {
    private Long userId;
    private String messageId;
    private String threadId;
    private String senderEmail;
    private String senderName;
    private List<String> recipients;
    private String subject;
    private String snippet;
    private String bodyPlain;
    private String bodyHtml;
    private LocalDateTime receivedAt;
}
