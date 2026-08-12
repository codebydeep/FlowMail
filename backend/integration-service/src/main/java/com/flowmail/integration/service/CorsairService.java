package com.flowmail.integration.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * All Corsair API calls live here.
 * Other services never call Corsair directly — they call this service.
 * This is where Google OAuth tokens are managed.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CorsairService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${corsair.api-key}")
    private String corsairApiKey;

    @Value("${corsair.base-url}")
    private String corsairBaseUrl;

    // ─── Gmail ────────────────────────────────────────────────────────────────

    public void sendEmail(Long userId, Map<String, Object> emailData) {
        String url = corsairBaseUrl + "/gmail/send";
        postToCorsair(url, userId, emailData);
        log.info("Email sent via Corsair for user {}", userId);
    }

    public void fetchAndSyncEmails(Long userId) {
        String url = corsairBaseUrl + "/gmail/messages?userId=" + userId + "&maxResults=50";
        try {
            ResponseEntity<String> response = getCorsair(url);
            // Parse and forward to email-service for storage
            log.info("Fetched emails from Corsair for user {}", userId);
        } catch (Exception e) {
            log.error("Failed to sync emails from Corsair for user {}: {}", userId, e.getMessage());
        }
    }

    // ─── Google Calendar ──────────────────────────────────────────────────────

    public String createCalendarEvent(Long userId, Map<String, Object> eventData) {
        String url = corsairBaseUrl + "/calendar/events";
        ResponseEntity<String> response = postToCorsair(url, userId, eventData);
        try {
            JsonNode node = objectMapper.readTree(response.getBody());
            return node.path("id").asText();
        } catch (Exception e) {
            log.warn("Could not parse event ID from Corsair response");
            return null;
        }
    }

    // ─── OAuth ────────────────────────────────────────────────────────────────

    /**
     * Returns the URL to redirect users to for Corsair OAuth.
     * Corsair handles Google OAuth and stores the token on its side.
     */
    public String getOAuthUrl(String provider, String stateToken) {
        return corsairBaseUrl + "/oauth/authorize"
                + "?provider=" + provider
                + "&state=" + stateToken
                + "&apiKey=" + corsairApiKey;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private ResponseEntity<String> postToCorsair(String url, Long userId, Map<String, Object> body) {
        HttpHeaders headers = buildHeaders(userId);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        return restTemplate.postForEntity(url, entity, String.class);
    }

    private ResponseEntity<String> getCorsair(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + corsairApiKey);
        return restTemplate.exchange(url, HttpMethod.GET, new HttpEntity<>(headers), String.class);
    }

    private HttpHeaders buildHeaders(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + corsairApiKey);
        headers.set("X-User-Id", String.valueOf(userId));
        return headers;
    }
}
