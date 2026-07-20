package com.kanban.app.controller;

import com.kanban.app.dto.request.MoveListRequest;
import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.CardResponse;
import com.kanban.app.dto.response.ListResponse;
import com.kanban.app.entity.BoardList;
import com.kanban.app.security.AuthUtil;
import com.kanban.app.service.BoardListService;
import com.kanban.app.service.CardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Lists")
public class BoardListController {

    private final BoardListService boardListService;
    private final CardService cardService;

    @PostMapping("/api/boards/{boardId}/lists")
    public ResponseEntity<ListResponse> create(@PathVariable Long boardId,
                                                 @Valid @RequestBody NameRequest request) {
        Long userId = AuthUtil.getCurrentUserId();
        BoardList list = boardListService.create(boardId, userId, request);
        return ResponseEntity.ok(toResponse(list, userId));
    }

    @GetMapping("/api/boards/{boardId}/lists")
    public ResponseEntity<List<ListResponse>> listByBoard(@PathVariable Long boardId) {
        Long userId = AuthUtil.getCurrentUserId();
        List<ListResponse> result = boardListService.listByBoard(boardId, userId).stream()
                .map(l -> toResponse(l, userId))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PatchMapping("/api/lists/{listId}/move")
    public ResponseEntity<Void> move(@PathVariable Long listId, @Valid @RequestBody MoveListRequest request) {
        boardListService.reorder(listId, AuthUtil.getCurrentUserId(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/lists/{listId}")
    public ResponseEntity<Void> archive(@PathVariable Long listId) {
        boardListService.archive(listId, AuthUtil.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    private ListResponse toResponse(BoardList list, Long userId) {
        List<CardResponse> cards = cardService.listByList(list.getId(), userId).stream()
                .map(CardResponse::from)
                .toList();
        return ListResponse.from(list, cards);
    }
}
