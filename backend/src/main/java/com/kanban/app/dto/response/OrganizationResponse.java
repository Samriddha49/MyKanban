package com.kanban.app.dto.response;

import com.kanban.app.entity.MemberRole;
import com.kanban.app.entity.Organization;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class OrganizationResponse {
    private Long id;
    private String name;
    private Instant createdAt;
    private MemberRole myRole;

    public static OrganizationResponse from(Organization org, MemberRole myRole) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .createdAt(org.getCreatedAt())
                .myRole(myRole)
                .build();
    }
}
