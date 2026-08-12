package com.flowmail.email.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EmailDetailDto {
    private Long id;
    private Long threadId;
    private String senderEmail;
    private String senderName;
    private List<String> recipients;
    private List<String> cc;
    private String subject;
    private String bodyPlain;
    private String bodyHtml;
    private LocalDateTime receivedAt;
    private boolean read;
    private boolean starred;
}
