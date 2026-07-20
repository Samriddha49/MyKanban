package com.kanban.app.controller;

import com.kanban.app.dto.request.CardRequest;
import com.kanban.app.dto.request.MoveCardRequest;
import com.kanban.app.dto.response.CardResponse;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.BoardService;
import com.kanban.app.service.CardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Cards")
public class CardController {

    private final CardService cardService;
    private final BoardService boardService;

    @PostMapping("/api/lists/{listId}/cards")
    public ResponseEntity<CardResponse> create(@PathVariable Long listId, @Valid @RequestBody CardRequest request) {
        return ResponseEntity.ok(CardResponse.from(cardService.create(listId, AuthUtil.getCurrentUserId(), request)));
    }

    @GetMapping("/api/cards/{cardId}")
    public ResponseEntity<CardResponse> get(@PathVariable Long cardId) {
        return ResponseEntity.ok(CardResponse.from(cardService.getEntityWithAccessCheck(cardId, AuthUtil.getCurrentUserId())));
    }

    @PutMapping("/api/cards/{cardId}")
    public ResponseEntity<CardResponse> update(@PathVariable Long cardId, @Valid @RequestBody CardRequest request) {
        return ResponseEntity.ok(CardResponse.from(cardService.update(cardId, AuthUtil.getCurrentUserId(), request)));
    }

    @PatchMapping("/api/cards/{cardId}/move")
    public ResponseEntity<CardResponse> move(@PathVariable Long cardId, @Valid @RequestBody MoveCardRequest request) {
        return ResponseEntity.ok(CardResponse.from(cardService.move(cardId, AuthUtil.getCurrentUserId(), request)));
    }

    @DeleteMapping("/api/cards/{cardId}")
    public ResponseEntity<Void> archive(@PathVariable Long cardId) {
        cardService.archive(cardId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/cards/{cardId}/labels/{labelId}")
    public ResponseEntity<CardResponse> addLabel(@PathVariable Long cardId, @PathVariable Long labelId) {
        return ResponseEntity.ok(CardResponse.from(cardService.addLabel(cardId, labelId, AuthUtil.getCurrentUserId())));
    }

    @DeleteMapping("/api/cards/{cardId}/labels/{labelId}")
    public ResponseEntity<CardResponse> removeLabel(@PathVariable Long cardId, @PathVariable Long labelId) {
        return ResponseEntity.ok(CardResponse.from(cardService.removeLabel(cardId, labelId, AuthUtil.getCurrentUserId())));
    }

    @PostMapping("/api/cards/{cardId}/assignees/{userId}")
    public ResponseEntity<CardResponse> assign(@PathVariable Long cardId, @PathVariable Long userId) {
        return ResponseEntity.ok(CardResponse.from(cardService.assignMember(cardId, userId, AuthUtil.getCurrentUserId())));
    }

    @DeleteMapping("/api/cards/{cardId}/assignees/{userId}")
    public ResponseEntity<CardResponse> unassign(@PathVariable Long cardId, @PathVariable Long userId) {
        return ResponseEntity.ok(CardResponse.from(cardService.unassignMember(cardId, userId, AuthUtil.getCurrentUserId())));
    }

    @GetMapping("/api/boards/{boardId}/cards/search")
    public ResponseEntity<List<CardResponse>> search(@PathVariable Long boardId, @RequestParam String query) {
        Long userId = AuthUtil.getCurrentUserId();
        boardService.getEntityWithAccessCheck(boardId, userId); // authorization check
        return ResponseEntity.ok(cardService.search(boardId, userId, query).stream().map(CardResponse::from).toList());
    }

    @GetMapping("/api/boards/{boardId}/cards/filter")
    public ResponseEntity<List<CardResponse>> filter(@PathVariable Long boardId,
                                                       @RequestParam(required = false) Long labelId,
                                                       @RequestParam(required = false) Long assigneeId) {
        Long userId = AuthUtil.getCurrentUserId();
        boardService.getEntityWithAccessCheck(boardId, userId); // authorization check
        return ResponseEntity.ok(cardService.filter(boardId, labelId, assigneeId).stream().map(CardResponse::from).toList());
    }
}
