package com.flowmail.integration.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookProcessingService {

    private final RestTemplate restTemplate;

    @Value("${services.email-url}")
    private String emailServiceUrl;

    public void process(JsonNode payload) {
        String eventType = payload.path("type").asText();
        log.info("Processing webhook event type: {}", eventType);

        switch (eventType) {
            case "gmail.message.created", "gmail.message.received" -> processNewEmail(payload);
            case "calendar.event.created" -> log.info("Calendar event webhook received (no action needed)");
            default -> log.warn("Unknown webhook event type: {}", eventType);
        }
    }

    private void processNewEmail(JsonNode payload) {
        try {
            JsonNode message = payload.path("data");
            Long userId = payload.path("userId").asLong();

            // Build the payload for email-service ingestion
            Map<String, Object> emailPayload = new LinkedHashMap<>();
            emailPayload.put("userId", userId);
            emailPayload.put("messageId", message.path("id").asText());
            emailPayload.put("threadId", message.path("threadId").asText());
            emailPayload.put("senderEmail", message.path("from").path("email").asText());
            emailPayload.put("senderName", message.path("from").path("name").asText(""));
            emailPayload.put("subject", message.path("subject").asText("(no subject)"));
            emailPayload.put("snippet", message.path("snippet").asText(""));
            emailPayload.put("bodyPlain", message.path("body").path("plain").asText(""));
            emailPayload.put("bodyHtml", message.path("body").path("html").asText(""));
            emailPayload.put("receivedAt", LocalDateTime.now().toString());

            // Forward to email-service internal endpoint
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            restTemplate.postForEntity(
                    emailServiceUrl + "/internal/emails/ingest",
                    new HttpEntity<>(emailPayload, headers),
                    Void.class);

            log.info("Forwarded webhook email {} to email-service for user {}", 
                    emailPayload.get("messageId"), userId);

        } catch (Exception e) {
            log.error("Failed to process new email webhook: {}", e.getMessage());
        }
    }
}
