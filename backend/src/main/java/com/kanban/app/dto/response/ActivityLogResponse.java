package com.kanban.app.dto.response;

import com.kanban.app.entity.ActivityLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class ActivityLogResponse {
    private Long id;
    private String action;
    private String details;
    private UserSummaryResponse actor;
    private Instant createdAt;

    public static ActivityLogResponse from(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .actor(UserSummaryResponse.from(log.getActor()))
                .createdAt(log.getCreatedAt())
                .build();
    }
}
