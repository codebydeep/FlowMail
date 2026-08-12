package com.flowmail.calendar.service;

import com.flowmail.calendar.dto.AvailabilitySlot;
import com.flowmail.calendar.dto.CreateEventRequest;
import com.flowmail.calendar.entity.CalendarEvent;
import com.flowmail.calendar.entity.EventAttendee;
import com.flowmail.calendar.repository.CalendarEventRepository;
import com.flowmail.calendar.repository.EventAttendeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository eventRepository;
    private final EventAttendeeRepository attendeeRepository;
    private final RestTemplate restTemplate;

    @Value("${services.integration-url}")
    private String integrationUrl;

    public List<CalendarEvent> getEvents(Long userId, LocalDateTime from, LocalDateTime to) {
        return eventRepository.findActiveEvents(userId, from, to);
    }

    @Transactional
    public CalendarEvent createEvent(Long userId, CreateEventRequest request) {
        CalendarEvent event = CalendarEvent.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .timezone(request.getTimezone() != null ? request.getTimezone() : "UTC")
                .allDay(request.isAllDay())
                .status(CalendarEvent.Status.CONFIRMED)
                .sourceEmailId(request.getSourceEmailId())
                .build();

        event = eventRepository.save(event);

        // Save attendees
        if (request.getAttendeeEmails() != null) {
            Long eventId = event.getId();
            List<EventAttendee> attendees = request.getAttendeeEmails().stream()
                    .map(email -> EventAttendee.builder()
                            .eventId(eventId)
                            .email(email)
                            .responseStatus(EventAttendee.ResponseStatus.PENDING)
                            .build())
                    .toList();
            attendeeRepository.saveAll(attendees);
        }

        // Sync to Google Calendar via Corsair
        syncToGoogleCalendar(userId, event, request);

        log.info("Created calendar event {} for user {}", event.getId(), userId);
        return event;
    }

    /**
     * Find available time slots for the user in a given date range.
     * Returns slots of the requested duration that are free.
     */
    public List<AvailabilitySlot> findAvailableSlots(Long userId,
                                                      LocalDateTime rangeStart,
                                                      LocalDateTime rangeEnd,
                                                      int durationMinutes) {
        List<CalendarEvent> busy = eventRepository.findActiveEvents(userId, rangeStart, rangeEnd);
        List<AvailabilitySlot> slots = new ArrayList<>();

        // Walk through each day in range, 9 AM–6 PM, looking for free blocks
        LocalDateTime cursor = rangeStart.with(LocalTime.of(9, 0));
        while (cursor.isBefore(rangeEnd)) {
            LocalDateTime slotEnd = cursor.plusMinutes(durationMinutes);

            if (slotEnd.toLocalTime().isAfter(LocalTime.of(18, 0))) {
                // Move to next day 9 AM
                cursor = cursor.plusDays(1).with(LocalTime.of(9, 0));
                continue;
            }

            boolean isFree = isFree(busy, cursor, slotEnd);
            if (isFree) {
                slots.add(new AvailabilitySlot(cursor, slotEnd));
                if (slots.size() >= 5) break; // Return top 5 suggestions
            }

            cursor = cursor.plusMinutes(30); // Check every 30 min
        }

        return slots;
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private boolean isFree(List<CalendarEvent> busy, LocalDateTime start, LocalDateTime end) {
        return busy.stream().noneMatch(event ->
                start.isBefore(event.getEndTime()) && end.isAfter(event.getStartTime()));
    }

    private void syncToGoogleCalendar(Long userId, CalendarEvent event, CreateEventRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-User-Id", String.valueOf(userId));

            Map<String, Object> body = Map.of(
                    "title", event.getTitle(),
                    "description", event.getDescription() != null ? event.getDescription() : "",
                    "startTime", event.getStartTime().toString(),
                    "endTime", event.getEndTime().toString(),
                    "attendees", request.getAttendeeEmails() != null ? request.getAttendeeEmails() : List.of(),
                    "sendNotifications", request.isSendInvite()
            );

            restTemplate.postForEntity(
                    integrationUrl + "/internal/calendar/events",
                    new HttpEntity<>(body, headers),
                    Map.class);

        } catch (Exception e) {
            log.warn("Failed to sync event to Google Calendar: {}. Saved locally only.", e.getMessage());
        }
    }
}
