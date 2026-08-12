package com.flowmail.notification.service;

import com.flowmail.notification.dto.EmailReceivedEvent;
import com.flowmail.notification.dto.RealtimeNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Listens to Kafka events and pushes them to connected WebSocket clients.
 * Frontend subscribes to /topic/notifications/{userId}
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "email.received", groupId = "notification-service")
    public void onEmailReceived(EmailReceivedEvent event) {
        log.info("Pushing new email notification to user {}", event.getUserId());

        RealtimeNotification notification = RealtimeNotification.builder()
                .type("NEW_EMAIL")
                .title("New email from " + event.getSenderEmail())
                .body(event.getSubject())
                .payload(event)
                .build();

        // Push to the user's personal topic
        messagingTemplate.convertAndSend(
                "/topic/notifications/" + event.getUserId(),
                notification);
    }
}
