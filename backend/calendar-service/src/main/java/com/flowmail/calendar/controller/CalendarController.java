package com.flowmail.calendar.controller;

import com.flowmail.calendar.dto.AvailabilitySlot;
import com.flowmail.calendar.dto.CreateEventRequest;
import com.flowmail.calendar.entity.CalendarEvent;
import com.flowmail.calendar.service.CalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    /** GET /api/calendar/events?from=...&to=... */
    @GetMapping("/events")
    public ResponseEntity<List<CalendarEvent>> getEvents(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(calendarService.getEvents(userId, from, to));
    }

    /** POST /api/calendar/events */
    @PostMapping("/events")
    public ResponseEntity<CalendarEvent> createEvent(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateEventRequest request) {
        return ResponseEntity.ok(calendarService.createEvent(userId, request));
    }

    /**
     * GET /api/calendar/availability?from=...&to=...&duration=30
     * Returns available slots for scheduling
     */
    @GetMapping("/availability")
    public ResponseEntity<List<AvailabilitySlot>> availability(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "30") int duration) {
        return ResponseEntity.ok(calendarService.findAvailableSlots(userId, from, to, duration));
    }
}
