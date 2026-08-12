package com.flowmail.email.controller;

import com.flowmail.email.dto.EmailDetailDto;
import com.flowmail.email.dto.EmailSummaryDto;
import com.flowmail.email.dto.SendEmailRequest;
import com.flowmail.email.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    /** GET /api/emails?page=0&size=20 */
    @GetMapping
    public ResponseEntity<Page<EmailSummaryDto>> getInbox(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emailService.getInbox(userId, page, size));
    }

    /** GET /api/emails/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<EmailDetailDto> getEmail(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        return ResponseEntity.ok(emailService.getEmail(userId, id));
    }

    /** GET /api/emails/search?q=pricing+problem */
    @GetMapping("/search")
    public ResponseEntity<Page<EmailSummaryDto>> search(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(emailService.search(userId, q, page, size));
    }

    /** POST /api/emails/send */
    @PostMapping("/send")
    public ResponseEntity<Void> send(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody SendEmailRequest request) {
        emailService.sendEmail(userId, request);
        return ResponseEntity.ok().build();
    }

    /** GET /api/emails/unread-count */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(Map.of("count", emailService.getUnreadCount(userId)));
    }
}
