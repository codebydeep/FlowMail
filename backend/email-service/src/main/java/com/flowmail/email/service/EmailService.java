package com.flowmail.email.service;

import com.flowmail.email.dto.*;
import com.flowmail.email.entity.Email;
import com.flowmail.email.entity.EmailThread;
import com.flowmail.email.event.EmailReceivedEvent;
import com.flowmail.email.repository.EmailRepository;
import com.flowmail.email.repository.EmailThreadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final String TOPIC_EMAIL_RECEIVED = "email.received";

    private final EmailRepository emailRepository;
    private final EmailThreadRepository threadRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final CorsairEmailClient corsairClient;

    // ─── Inbox ────────────────────────────────────────────────────────────────

    public Page<EmailSummaryDto> getInbox(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return emailRepository
                .findByUserIdAndArchivedFalseAndTrashedFalseOrderByReceivedAtDesc(userId, pageable)
                .map(this::toSummary);
    }

    public EmailDetailDto getEmail(Long userId, Long emailId) {
        Email email = emailRepository.findById(emailId)
                .filter(e -> e.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Email not found"));

        // Mark as read
        if (!email.isRead()) {
            email.setRead(true);
            emailRepository.save(email);
        }

        return toDetail(email);
    }

    public Page<EmailSummaryDto> search(Long userId, String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        String mysqlQuery = "+" + query.trim().replace(" ", " +");
        return emailRepository.fulltextSearch(userId, mysqlQuery, pageable).map(this::toSummary);
    }

    // ─── Sync from Corsair ────────────────────────────────────────────────────

    @Transactional
    public void syncEmailFromWebhook(WebhookEmailPayload payload) {
        // Idempotency — skip duplicates
        if (emailRepository.findByExternalMessageId(payload.getMessageId()).isPresent()) {
            log.debug("Email already exists: {}", payload.getMessageId());
            return;
        }

        // Resolve or create thread
        EmailThread thread = threadRepository
                .findByUserIdAndExternalThreadId(payload.getUserId(), payload.getThreadId())
                .orElseGet(() -> threadRepository.save(EmailThread.builder()
                        .userId(payload.getUserId())
                        .externalThreadId(payload.getThreadId())
                        .subject(payload.getSubject())
                        .lastMessageAt(payload.getReceivedAt())
                        .unreadCount(0)
                        .build()));

        thread.setLastMessageAt(payload.getReceivedAt());
        thread.setSnippet(payload.getSnippet());
        thread.setUnreadCount(thread.getUnreadCount() + 1);
        threadRepository.save(thread);

        Email email = Email.builder()
                .threadId(thread.getId())
                .userId(payload.getUserId())
                .externalMessageId(payload.getMessageId())
                .senderEmail(payload.getSenderEmail())
                .senderName(payload.getSenderName())
                .recipients(payload.getRecipients())
                .subject(payload.getSubject())
                .bodyPlain(payload.getBodyPlain())
                .bodyHtml(payload.getBodyHtml())
                .receivedAt(payload.getReceivedAt())
                .read(false)
                .build();

        email = emailRepository.save(email);
        log.info("Saved email {} for user {}", email.getId(), email.getUserId());

        // Publish to Kafka → AI Service + Notification Service
        EmailReceivedEvent event = EmailReceivedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .emailId(email.getId())
                .userId(email.getUserId())
                .senderEmail(email.getSenderEmail())
                .subject(email.getSubject())
                .bodyPlain(email.getBodyPlain())
                .receivedAt(email.getReceivedAt())
                .build();

        kafkaTemplate.send(TOPIC_EMAIL_RECEIVED, String.valueOf(email.getUserId()), event);
    }

    // ─── Send / Reply ─────────────────────────────────────────────────────────

    @Transactional
    public void sendEmail(Long userId, SendEmailRequest request) {
        // Delegate to Corsair. Corsair handles Gmail OAuth and sending.
        corsairClient.sendEmail(userId, request);
        log.info("Email sent via Corsair for user {}", userId);
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private EmailSummaryDto toSummary(Email e) {
        return EmailSummaryDto.builder()
                .id(e.getId())
                .senderEmail(e.getSenderEmail())
                .senderName(e.getSenderName())
                .subject(e.getSubject())
                .snippet(e.getBodyPlain() != null
                        ? e.getBodyPlain().substring(0, Math.min(200, e.getBodyPlain().length()))
                        : "")
                .receivedAt(e.getReceivedAt())
                .read(e.isRead())
                .starred(e.isStarred())
                .build();
    }

    private EmailDetailDto toDetail(Email e) {
        return EmailDetailDto.builder()
                .id(e.getId())
                .threadId(e.getThreadId())
                .senderEmail(e.getSenderEmail())
                .senderName(e.getSenderName())
                .recipients(e.getRecipients())
                .cc(e.getCc())
                .subject(e.getSubject())
                .bodyPlain(e.getBodyPlain())
                .bodyHtml(e.getBodyHtml())
                .receivedAt(e.getReceivedAt())
                .read(e.isRead())
                .starred(e.isStarred())
                .build();
    }

    public long getUnreadCount(Long userId) {
        return emailRepository.countByUserIdAndReadFalseAndArchivedFalse(userId);
    }
}
