package com.kanban.app.controller;

import com.kanban.app.dto.request.LabelRequest;
import com.kanban.app.dto.response.LabelResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.LabelService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Labels")
public class LabelController {

    private final LabelService labelService;

    @PostMapping("/api/boards/{boardId}/labels")
    public ResponseEntity<LabelResponse> create(@PathVariable Long boardId, @Valid @RequestBody LabelRequest request) {
        return ResponseEntity.ok(LabelResponse.from(labelService.create(boardId, AuthUtil.getCurrentUserId(), request)));
    }

    @GetMapping("/api/boards/{boardId}/labels")
    public ResponseEntity<List<LabelResponse>> listByBoard(@PathVariable Long boardId) {
        return ResponseEntity.ok(labelService.listByBoard(boardId, AuthUtil.getCurrentUserId()).stream()
                .map(LabelResponse::from).toList());
    }

    @DeleteMapping("/api/labels/{labelId}")
    public ResponseEntity<Void> delete(@PathVariable Long labelId) {
        labelService.delete(labelId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
