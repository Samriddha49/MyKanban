package com.kanban.app.controller;

import com.kanban.app.dto.request.AttachmentRequest;
import com.kanban.app.dto.response.AttachmentResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.AttachmentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Metadata-only attachment references; see README for file storage note")
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/api/cards/{cardId}/attachments")
    public ResponseEntity<AttachmentResponse> add(@PathVariable Long cardId, @Valid @RequestBody AttachmentRequest request) {
        return ResponseEntity.ok(AttachmentResponse.from(attachmentService.add(cardId, AuthUtil.getCurrentUserId(), request)));
    }

    @GetMapping("/api/cards/{cardId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> listByCard(@PathVariable Long cardId) {
        return ResponseEntity.ok(attachmentService.listByCard(cardId, AuthUtil.getCurrentUserId()).stream()
                .map(AttachmentResponse::from).toList());
    }

    @DeleteMapping("/api/attachments/{attachmentId}")
    public ResponseEntity<Void> delete(@PathVariable Long attachmentId) {
        attachmentService.delete(attachmentId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
