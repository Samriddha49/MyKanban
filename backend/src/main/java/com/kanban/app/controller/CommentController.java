package com.kanban.app.controller;

import com.kanban.app.dto.request.CommentRequest;
import com.kanban.app.dto.response.CommentResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.CommentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Comments")
public class CommentController {

    private final CommentService commentService;

    @PostMapping("/api/cards/{cardId}/comments")
    public ResponseEntity<CommentResponse> add(@PathVariable Long cardId, @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(CommentResponse.from(commentService.add(cardId, AuthUtil.getCurrentUserId(), request)));
    }

    @GetMapping("/api/cards/{cardId}/comments")
    public ResponseEntity<List<CommentResponse>> listByCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(commentService.listByCard(cardId, AuthUtil.getCurrentUserId()).stream()
                .map(CommentResponse::from).toList());
    }

    @PutMapping("/api/comments/{commentId}")
    public ResponseEntity<CommentResponse> update(@PathVariable Long commentId, @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.ok(CommentResponse.from(commentService.update(commentId, AuthUtil.getCurrentUserId(), request)));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> delete(@PathVariable Long commentId) {
        commentService.delete(commentId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
