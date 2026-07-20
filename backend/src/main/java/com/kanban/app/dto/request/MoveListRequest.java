package com.kanban.app.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MoveListRequest {

    @NotNull
    private Integer newPosition;
}
