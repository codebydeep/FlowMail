package com.flowmail.email.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class SendEmailRequest {

    @NotEmpty
    private List<String> to;

    private List<String> cc;

    @NotBlank
    private String subject;

    @NotBlank
    private String body;

    /** If replying, set the original message ID for threading */
    private String inReplyTo;

    /** Optional idempotency key to prevent duplicate sends */
    private String idempotencyKey;
}
