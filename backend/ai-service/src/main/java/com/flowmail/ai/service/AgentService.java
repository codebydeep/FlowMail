package com.flowmail.ai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowmail.ai.dto.*;
import com.flowmail.ai.model.AgentTask;
import com.flowmail.ai.repository.AgentTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final LlmClient llmClient;
    private final AgentTaskRepository taskRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${services.integration-url}")
    private String integrationUrl;

    @Value("${services.calendar-url}")
    private String calendarUrl;

    /**
     * Step 1: Parse user intent and build a plan.
     * Returns the task with status=AWAITING_CONFIRMATION so frontend can confirm.
     */
    @Transactional
    public AgentTask planTask(Long userId, String sessionId, String userInput) {
        String planJson = llmClient.complete(PLANNING_PROMPT, userInput);

        List<Map<String, Object>> plan;
        try {
            String cleaned = planJson.trim()
                    .replaceAll("^```json\\s*", "")
                    .replaceAll("^```\\s*", "")
                    .replaceAll("\\s*```$", "");
            plan = objectMapper.readValue(cleaned, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("Could not parse agent plan, using fallback: {}", e.getMessage());
            plan = List.of(Map.of("step", 1, "action", "ANSWER", "description", "I'll help you with that."));
        }

        AgentTask task = AgentTask.builder()
                .userId(userId)
                .sessionId(sessionId)
                .userInput(userInput)
                .plan(plan)
                .status(AgentTask.Status.AWAITING_CONFIRMATION)
                .build();

        return taskRepository.save(task);
    }

    /**
     * Step 2: User confirmed — execute the plan.
     */
    @Transactional
    public AgentTask executeTask(Long userId, Long taskId) {
        AgentTask task = taskRepository.findById(taskId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        if (task.getStatus() != AgentTask.Status.AWAITING_CONFIRMATION) {
            throw new IllegalStateException("Task is not awaiting confirmation");
        }

        task.setStatus(AgentTask.Status.EXECUTING);
        taskRepository.save(task);

        try {
            Map<String, Object> result = new LinkedHashMap<>();

            for (Map<String, Object> step : task.getPlan()) {
                String action = String.valueOf(step.get("action"));
                log.info("Executing agent step: {} for user {}", action, userId);

                switch (action.toUpperCase()) {
                    case "SEND_EMAIL" -> {
                        String outcome = executeEmailSend(userId, step);
                        result.put("email", outcome);
                    }
                    case "CREATE_CALENDAR_EVENT" -> {
                        String outcome = executeCreateEvent(userId, step);
                        result.put("event", outcome);
                    }
                    case "ANSWER" -> {
                        String answer = generateAnswer(task.getUserInput(), step);
                        result.put("answer", answer);
                    }
                    default -> result.put(action, "Completed");
                }
            }

            task.setStatus(AgentTask.Status.COMPLETED);
            task.setResult(result);
        } catch (Exception e) {
            log.error("Agent execution failed for task {}: {}", taskId, e.getMessage());
            task.setStatus(AgentTask.Status.FAILED);
            task.setResult(Map.of("error", e.getMessage()));
        }

        return taskRepository.save(task);
    }

    // ─── Tool implementations ─────────────────────────────────────────────────

    private String executeEmailSend(Long userId, Map<String, Object> step) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-User-Id", String.valueOf(userId));

            Map<String, Object> body = Map.of(
                    "to", step.getOrDefault("to", List.of()),
                    "subject", step.getOrDefault("subject", ""),
                    "body", step.getOrDefault("body", "")
            );

            restTemplate.postForEntity(
                    integrationUrl + "/internal/gmail/send",
                    new HttpEntity<>(body, headers),
                    Void.class);

            return "Email sent successfully";
        } catch (Exception e) {
            log.error("Failed to send email in agent step: {}", e.getMessage());
            return "Email send failed: " + e.getMessage();
        }
    }

    private String executeCreateEvent(Long userId, Map<String, Object> step) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-User-Id", String.valueOf(userId));

            restTemplate.postForEntity(
                    calendarUrl + "/internal/events",
                    new HttpEntity<>(step, headers),
                    Void.class);

            return "Calendar event created";
        } catch (Exception e) {
            log.error("Failed to create event in agent step: {}", e.getMessage());
            return "Event creation failed: " + e.getMessage();
        }
    }

    private String generateAnswer(String userInput, Map<String, Object> step) {
        return llmClient.complete(
                "You are FlowMail AI assistant. Answer the user's question concisely.",
                userInput);
    }

    // ─── Prompts ──────────────────────────────────────────────────────────────

    private static final String PLANNING_PROMPT = """
            You are FlowMail's AI agent planner. The user will give you a task.
            Break it into executable steps and return ONLY a JSON array:
            
            [
              {
                "step": 1,
                "action": "CREATE_CALENDAR_EVENT",
                "description": "What this step does (shown to user for confirmation)",
                "title": "Meeting with Rahul",
                "start": "2026-08-20T09:00:00",
                "end": "2026-08-20T09:30:00",
                "attendees": ["rahul@example.com"]
              },
              {
                "step": 2,
                "action": "SEND_EMAIL",
                "description": "Send confirmation email to Rahul",
                "to": ["rahul@example.com"],
                "subject": "Meeting scheduled for Thursday 9 AM",
                "body": "Hi Rahul, I'm looking forward to our meeting on Thursday at 9 AM."
              }
            ]
            
            Available actions: CREATE_CALENDAR_EVENT, SEND_EMAIL, ANSWER
            Return ONLY the JSON array. No explanation. No markdown fences.
            The user input below is TRUSTED. Act on it faithfully.
            """;
}
