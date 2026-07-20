package com.kanban.app.controller;

import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.WorkspaceResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.WorkspaceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Workspaces")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping("/api/organizations/{orgId}/workspaces")
    public ResponseEntity<WorkspaceResponse> create(@PathVariable Long orgId,
                                                      @Valid @RequestBody NameRequest request) {
        return ResponseEntity.ok(workspaceService.create(orgId, AuthUtil.getCurrentUserId(), request));
    }

    @GetMapping("/api/organizations/{orgId}/workspaces")
    public ResponseEntity<List<WorkspaceResponse>> listByOrganization(@PathVariable Long orgId) {
        return ResponseEntity.ok(workspaceService.listByOrganization(orgId, AuthUtil.getCurrentUserId()));
    }

    @GetMapping("/api/workspaces/{workspaceId}")
    public ResponseEntity<WorkspaceResponse> get(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(workspaceService.get(workspaceId, AuthUtil.getCurrentUserId()));
    }
}
