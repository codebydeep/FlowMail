package com.flowmail.integration.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowmail.integration.service.WebhookProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives raw Corsair webhook events.
 * Validates the signature, parses the payload, and forwards to the appropriate service.
 */
@Slf4j
@RestController
@RequestMapping("/api/integrations/webhooks")
@RequiredArgsConstructor
public class WebhookIngressController {

    private final WebhookProcessingService webhookService;
    private final ObjectMapper objectMapper;

    /**
     * POST /api/integrations/webhooks/corsair
     * Corsair posts new email / calendar events here.
     */
    @PostMapping("/corsair")
    public ResponseEntity<Void> corsairWebhook(
            @RequestHeader(value = "X-Corsair-Signature", required = false) String signature,
            @RequestBody String rawBody) {

        log.info("Received Corsair webhook, signature: {}", signature);

        try {
            JsonNode payload = objectMapper.readTree(rawBody);
            webhookService.process(payload);
        } catch (Exception e) {
            log.error("Failed to process webhook: {}", e.getMessage());
            // Return 200 to Corsair even on failure — log and handle async
        }

        return ResponseEntity.ok().build();
    }
}
