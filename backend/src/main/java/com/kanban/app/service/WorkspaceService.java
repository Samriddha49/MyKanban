package com.kanban.app.service;

import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.WorkspaceResponse;
import com.kanban.app.entity.Organization;
import com.kanban.app.entity.User;
import com.kanban.app.entity.Workspace;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.OrganizationRepository;
import com.kanban.app.repository.UserRepository;
import com.kanban.app.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final MembershipService membershipService;

    public WorkspaceResponse create(Long orgId, Long userId, NameRequest request) {
        membershipService.requireMembership(orgId, userId);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Workspace ws = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organization(org)
                .createdBy(creator)
                .build();
        ws = workspaceRepository.save(ws);
        return WorkspaceResponse.from(ws);
    }

    public List<WorkspaceResponse> listByOrganization(Long orgId, Long userId) {
        membershipService.requireMembership(orgId, userId);
        return workspaceRepository.findByOrganizationId(orgId).stream()
                .map(WorkspaceResponse::from)
                .toList();
    }

    public WorkspaceResponse get(Long workspaceId, Long userId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        membershipService.requireMembership(ws.getOrganization().getId(), userId);
        return WorkspaceResponse.from(ws);
    }

    public Workspace getEntityWithAccessCheck(Long workspaceId, Long userId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        membershipService.requireMembership(ws.getOrganization().getId(), userId);
        return ws;
    }
}
