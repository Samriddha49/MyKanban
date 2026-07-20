package com.kanban.app.dto.response;

import com.kanban.app.entity.Workspace;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class WorkspaceResponse {
    private Long id;
    private String name;
    private String description;
    private Long organizationId;
    private Instant createdAt;

    public static WorkspaceResponse from(Workspace ws) {
        return WorkspaceResponse.builder()
                .id(ws.getId())
                .name(ws.getName())
                .description(ws.getDescription())
                .organizationId(ws.getOrganization().getId())
                .createdAt(ws.getCreatedAt())
                .build();
    }
}
