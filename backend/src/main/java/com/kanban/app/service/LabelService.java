package com.kanban.app.service;

import com.kanban.app.dto.request.LabelRequest;
import com.kanban.app.entity.Board;
import com.kanban.app.entity.Label;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.LabelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelRepository labelRepository;
    private final BoardService boardService;

    public Label create(Long boardId, Long userId, LabelRequest request) {
        Board board = boardService.getEntityWithAccessCheck(boardId, userId);
        Label label = Label.builder()
                .name(request.getName())
                .color(request.getColor())
                .board(board)
                .build();
        return labelRepository.save(label);
    }

    public List<Label> listByBoard(Long boardId, Long userId) {
        boardService.getEntityWithAccessCheck(boardId, userId);
        return labelRepository.findByBoardId(boardId);
    }

    public void delete(Long labelId, Long userId) {
        Label label = labelRepository.findById(labelId)
                .orElseThrow(() -> new ResourceNotFoundException("Label not found"));
        boardService.getEntityWithAccessCheck(label.getBoard().getId(), userId);
        labelRepository.delete(label);
    }
}
