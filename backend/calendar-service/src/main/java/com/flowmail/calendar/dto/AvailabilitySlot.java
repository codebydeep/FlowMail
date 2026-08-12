package com.flowmail.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class AvailabilitySlot {
    private LocalDateTime start;
    private LocalDateTime end;
}
