package com.kanban.app.dto.response;

import com.kanban.app.entity.Board;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
public class BoardResponse {
    private Long id;
    private String name;
    private String backgroundColor;
    private Long workspaceId;
    private boolean archived;
    private Instant createdAt;

    public static BoardResponse from(Board board) {
        return BoardResponse.builder()
                .id(board.getId())
                .name(board.getName())
                .backgroundColor(board.getBackgroundColor())
                .workspaceId(board.getWorkspace().getId())
                .archived(board.isArchived())
                .createdAt(board.getCreatedAt())
                .build();
    }
}
