package com.flowmail.email.controller;

import com.flowmail.email.dto.WebhookEmailPayload;
import com.flowmail.email.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Internal endpoint — called by integration-service only, not exposed via gateway.
 * The gateway routes /api/emails/** — this is on /internal/** which is not routed.
 */
@Slf4j
@RestController
@RequestMapping("/internal/emails")
@RequiredArgsConstructor
public class WebhookController {

    private final EmailService emailService;

    @PostMapping("/ingest")
    public ResponseEntity<Void> ingest(@RequestBody WebhookEmailPayload payload) {
        log.info("Ingesting email {} for user {}", payload.getMessageId(), payload.getUserId());
        emailService.syncEmailFromWebhook(payload);
        return ResponseEntity.ok().build();
    }
}
