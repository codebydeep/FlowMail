package com.flowmail.calendar.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "event_attendees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventAttendee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(nullable = false)
    private String email;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "response_status")
    private ResponseStatus responseStatus;

    public enum ResponseStatus { ACCEPTED, DECLINED, TENTATIVE, PENDING }
}
