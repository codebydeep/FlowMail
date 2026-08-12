package com.flowmail.email.service;

import com.flowmail.email.dto.SendEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client that calls the Integration Service, which in turn calls Corsair.
 * The email-service never holds Google OAuth tokens — that's the integration-service's job.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CorsairEmailClient {

    private final RestTemplate restTemplate;

    @Value("${services.integration-url}")
    private String integrationServiceUrl;

    public void sendEmail(Long userId, SendEmailRequest request) {
        String url = integrationServiceUrl + "/internal/gmail/send";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-User-Id", String.valueOf(userId));

        Map<String, Object> body = Map.of(
                "to", request.getTo(),
                "cc", request.getCc() != null ? request.getCc() : java.util.List.of(),
                "subject", request.getSubject(),
                "body", request.getBody(),
                "inReplyTo", request.getInReplyTo() != null ? request.getInReplyTo() : ""
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.postForEntity(url, entity, Void.class);
        } catch (Exception e) {
            log.error("Failed to send email via Corsair for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
