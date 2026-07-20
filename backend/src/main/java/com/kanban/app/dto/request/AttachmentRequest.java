package com.kanban.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AttachmentRequest {

    @NotBlank
    private String fileName;

    @NotBlank
    private String url;
}
