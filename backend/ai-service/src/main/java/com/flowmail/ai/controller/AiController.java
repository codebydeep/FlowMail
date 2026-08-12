package com.flowmail.ai.controller;

import com.flowmail.ai.dto.AgentChatRequest;
import com.flowmail.ai.model.AgentTask;
import com.flowmail.ai.model.EmailAnalysis;
import com.flowmail.ai.service.AgentService;
import com.flowmail.ai.service.EmailClassificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final EmailClassificationService classificationService;
    private final AgentService agentService;

    /** GET /api/ai/analysis/{emailId} */
    @GetMapping("/analysis/{emailId}")
    public ResponseEntity<EmailAnalysis> getAnalysis(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long emailId) {
        EmailAnalysis analysis = classificationService.getAnalysis(emailId);
        if (analysis == null || !analysis.getUserId().equals(userId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(analysis);
    }

    /**
     * POST /api/ai/agent/chat
     * Step 1: Plan task from natural language → returns plan for user confirmation
     */
    @PostMapping("/agent/chat")
    public ResponseEntity<AgentTask> agentChat(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody AgentChatRequest request) {
        AgentTask task = agentService.planTask(userId, request.getSessionId(), request.getMessage());
        return ResponseEntity.ok(task);
    }

    /**
     * POST /api/ai/agent/confirm/{taskId}
     * Step 2: User confirmed → execute the plan
     */
    @PostMapping("/agent/confirm/{taskId}")
    public ResponseEntity<AgentTask> confirmAndExecute(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long taskId) {
        AgentTask task = agentService.executeTask(userId, taskId);
        return ResponseEntity.ok(task);
    }
}
