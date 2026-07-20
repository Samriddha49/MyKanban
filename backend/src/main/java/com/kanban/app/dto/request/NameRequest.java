package com.kanban.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NameRequest {

    @NotBlank
    private String name;

    private String description; // optional, used by Workspace
    private String backgroundColor; // optional, used by Board
}
