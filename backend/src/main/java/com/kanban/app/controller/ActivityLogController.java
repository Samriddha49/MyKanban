package com.kanban.app.controller;

import com.kanban.app.dto.response.ActivityLogResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.ActivityLogService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Activity Log")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/api/boards/{boardId}/activity")
    public ResponseEntity<List<ActivityLogResponse>> getForBoard(@PathVariable Long boardId) {
        return ResponseEntity.ok(activityLogService.getForBoard(boardId, AuthUtil.getCurrentUserId()));
    }
}
