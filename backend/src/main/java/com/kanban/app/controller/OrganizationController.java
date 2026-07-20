package com.kanban.app.controller;

import com.kanban.app.dto.request.InviteMemberRequest;
import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.OrganizationResponse;
import com.kanban.app.dto.response.UserSummaryResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.OrganizationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrganizationResponse> create(@Valid @RequestBody NameRequest request) {
        return ResponseEntity.ok(organizationService.create(request.getName(), AuthUtil.getCurrentUserId()));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> listMine() {
        return ResponseEntity.ok(organizationService.listMine(AuthUtil.getCurrentUserId()));
    }

    @GetMapping("/{orgId}")
    public ResponseEntity<OrganizationResponse> get(@PathVariable Long orgId) {
        return ResponseEntity.ok(organizationService.get(orgId, AuthUtil.getCurrentUserId()));
    }

    @PostMapping("/{orgId}/members")
    public ResponseEntity<UserSummaryResponse> inviteMember(@PathVariable Long orgId,
                                                             @Valid @RequestBody InviteMemberRequest request) {
        return ResponseEntity.ok(organizationService.inviteMember(orgId, AuthUtil.getCurrentUserId(), request));
    }

    @GetMapping("/{orgId}/members")
    public ResponseEntity<List<UserSummaryResponse>> listMembers(@PathVariable Long orgId) {
        return ResponseEntity.ok(organizationService.listMembers(orgId, AuthUtil.getCurrentUserId()));
    }
}
