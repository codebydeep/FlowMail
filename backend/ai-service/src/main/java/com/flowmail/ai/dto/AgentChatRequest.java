package com.flowmail.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AgentChatRequest {

    @NotBlank
    private String message;

    @NotBlank
    private String sessionId;
}
