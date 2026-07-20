package com.kanban.app.controller;

import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.BoardResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.BoardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Boards")
public class BoardController {

    private final BoardService boardService;

    @PostMapping("/api/workspaces/{workspaceId}/boards")
    public ResponseEntity<BoardResponse> create(@PathVariable Long workspaceId,
                                                  @Valid @RequestBody NameRequest request) {
        return ResponseEntity.ok(boardService.create(workspaceId, AuthUtil.getCurrentUserId(), request));
    }

    @GetMapping("/api/workspaces/{workspaceId}/boards")
    public ResponseEntity<List<BoardResponse>> listByWorkspace(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(boardService.listByWorkspace(workspaceId, AuthUtil.getCurrentUserId()));
    }

    @GetMapping("/api/boards/{boardId}")
    public ResponseEntity<BoardResponse> get(@PathVariable Long boardId) {
        return ResponseEntity.ok(boardService.get(boardId, AuthUtil.getCurrentUserId()));
    }

    @DeleteMapping("/api/boards/{boardId}")
    public ResponseEntity<Void> archive(@PathVariable Long boardId) {
        boardService.archive(boardId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
