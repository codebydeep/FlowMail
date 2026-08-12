package com.flowmail.notification.consumer;

import com.flowmail.notification.dto.EmailReceivedEvent;
import com.flowmail.notification.dto.RealtimeNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Listens to Kafka email.received events and pushes to the user's
     * WebSocket topic via STOMP. The frontend subscribes to
     * /topic/notifications/{userId} to receive realtime updates.
     */
    @KafkaListener(topics = "email.received", groupId = "notification-service")
    public void onEmailReceived(EmailReceivedEvent event) {
        log.info("Pushing notification for email {} to user {}", event.getEmailId(), event.getUserId());

        RealtimeNotification notification = RealtimeNotification.builder()
                .type("NEW_EMAIL")
                .title("New email from " + event.getSenderEmail())
                .body(event.getSubject())
                .payload(event)
                .build();

        String destination = "/topic/notifications/" + event.getUserId();
        messagingTemplate.convertAndSend(destination, notification);
    }
}
