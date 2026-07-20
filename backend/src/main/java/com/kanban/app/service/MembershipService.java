package com.kanban.app.service;

import com.kanban.app.entity.*;
import com.kanban.app.exception.ForbiddenException;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.OrganizationMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Centralizes authorization checks. Access to a Workspace/Board/List/Card is derived
 * from Organization membership: any member of the parent Organization can view boards
 * within it. Only OWNER/ADMIN roles can invite members or delete the organization.
 * This is a simplification -- see README for the reasoning.
 */
@Service
@RequiredArgsConstructor
public class MembershipService {

    private final OrganizationMemberRepository organizationMemberRepository;

    public MemberRole requireMembership(Long organizationId, Long userId) {
        OrganizationMember member = organizationMemberRepository
                .findByOrganizationIdAndUserId(organizationId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this organization"));
        return member.getRole();
    }

    public void requireAdminOrOwner(Long organizationId, Long userId) {
        MemberRole role = requireMembership(organizationId, userId);
        if (role != MemberRole.OWNER && role != MemberRole.ADMIN) {
            throw new ForbiddenException("Only organization admins/owners can perform this action");
        }
    }

    public void requireOwner(Long organizationId, Long userId) {
        MemberRole role = requireMembership(organizationId, userId);
        if (role != MemberRole.OWNER) {
            throw new ForbiddenException("Only the organization owner can perform this action");
        }
    }
}
