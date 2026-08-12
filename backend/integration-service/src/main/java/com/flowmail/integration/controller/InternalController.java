package com.flowmail.integration.controller;

import com.flowmail.integration.service.CorsairService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Internal endpoints — called by other microservices, not exposed via gateway.
 */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalController {

    private final CorsairService corsairService;

    /** Called by email-service to send an email */
    @PostMapping("/gmail/send")
    public ResponseEntity<Void> sendEmail(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> emailData) {
        corsairService.sendEmail(userId, emailData);
        return ResponseEntity.ok().build();
    }

    /** Called by calendar-service to create a Google Calendar event */
    @PostMapping("/calendar/events")
    public ResponseEntity<Map<String, String>> createCalendarEvent(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, Object> eventData) {
        String externalId = corsairService.createCalendarEvent(userId, eventData);
        return ResponseEntity.ok(Map.of("externalEventId", externalId != null ? externalId : ""));
    }

    /** Called by frontend (via gateway) to start OAuth */
    @GetMapping("/oauth/url")
    public ResponseEntity<Map<String, String>> getOAuthUrl(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String provider,
            @RequestParam String state) {
        String url = corsairService.getOAuthUrl(provider, state);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
