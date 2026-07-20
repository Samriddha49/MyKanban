package com.kanban.app.dto.response;

import com.kanban.app.entity.Attachment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class AttachmentResponse {
    private Long id;
    private String fileName;
    private String url;
    private UserSummaryResponse uploadedBy;
    private Instant createdAt;

    public static AttachmentResponse from(Attachment a) {
        return AttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .url(a.getUrl())
                .uploadedBy(UserSummaryResponse.from(a.getUploadedBy()))
                .createdAt(a.getCreatedAt())
                .build();
    }
}
