package com.flowmail.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateEventRequest {

    @NotBlank
    private String title;

    private String description;
    private String location;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    private String timezone = "UTC";
    private boolean allDay = false;
    private List<String> attendeeEmails;

    /** If this event was created from an email, set the email ID */
    private Long sourceEmailId;

    /** Optional: sends a confirmation reply to the email sender */
    private boolean sendInvite = true;
}
