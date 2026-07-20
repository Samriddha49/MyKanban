package com.kanban.app.service;

import com.kanban.app.dto.request.InviteMemberRequest;
import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.OrganizationResponse;
import com.kanban.app.dto.response.UserSummaryResponse;
import com.kanban.app.entity.MemberRole;
import com.kanban.app.entity.Organization;
import com.kanban.app.entity.OrganizationMember;
import com.kanban.app.entity.User;
import com.kanban.app.exception.BadRequestException;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.OrganizationMemberRepository;
import com.kanban.app.repository.OrganizationRepository;
import com.kanban.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final UserRepository userRepository;
    private final MembershipService membershipService;

    @Transactional
    public OrganizationResponse create(String name, Long userId) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Organization org = Organization.builder()
                .name(name)
                .createdBy(creator)
                .build();
        org = organizationRepository.save(org);

        OrganizationMember owner = OrganizationMember.builder()
                .organization(org)
                .user(creator)
                .role(MemberRole.OWNER)
                .build();
        organizationMemberRepository.save(owner);

        return OrganizationResponse.from(org, MemberRole.OWNER);
    }

    public List<OrganizationResponse> listMine(Long userId) {
        return organizationMemberRepository.findByUserId(userId).stream()
                .map(m -> OrganizationResponse.from(m.getOrganization(), m.getRole()))
                .toList();
    }

    public OrganizationResponse get(Long orgId, Long userId) {
        MemberRole role = membershipService.requireMembership(orgId, userId);
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        return OrganizationResponse.from(org, role);
    }

    @Transactional
    public UserSummaryResponse inviteMember(Long orgId, Long inviterId, InviteMemberRequest request) {
        membershipService.requireAdminOrOwner(orgId, inviterId);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

        User invitee = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No registered user found with email " + request.getEmail()));

        if (organizationMemberRepository.existsByOrganizationIdAndUserId(orgId, invitee.getId())) {
            throw new BadRequestException("User is already a member of this organization");
        }

        OrganizationMember member = OrganizationMember.builder()
                .organization(org)
                .user(invitee)
                .role(request.getRole())
                .build();
        organizationMemberRepository.save(member);

        return UserSummaryResponse.from(invitee);
    }

    public List<UserSummaryResponse> listMembers(Long orgId, Long userId) {
        membershipService.requireMembership(orgId, userId);
        return organizationMemberRepository.findByOrganizationId(orgId).stream()
                .map(m -> UserSummaryResponse.from(m.getUser()))
                .toList();
    }
}
