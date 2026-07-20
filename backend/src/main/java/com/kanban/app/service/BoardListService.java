package com.kanban.app.service;

import com.kanban.app.dto.request.MoveListRequest;
import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.entity.Board;
import com.kanban.app.entity.BoardList;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.BoardListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardListService {

    private final BoardListRepository boardListRepository;
    private final BoardService boardService;

    @Transactional
    public BoardList create(Long boardId, Long userId, NameRequest request) {
        Board board = boardService.getEntityWithAccessCheck(boardId, userId);
        int nextPosition = boardListRepository.findByBoardIdAndArchivedFalseOrderByPositionAsc(boardId).size();

        BoardList list = BoardList.builder()
                .name(request.getName())
                .board(board)
                .position(nextPosition)
                .archived(false)
                .build();
        return boardListRepository.save(list);
    }

    public List<BoardList> listByBoard(Long boardId, Long userId) {
        boardService.getEntityWithAccessCheck(boardId, userId);
        return boardListRepository.findByBoardIdAndArchivedFalseOrderByPositionAsc(boardId);
    }

    public BoardList getEntityWithAccessCheck(Long listId, Long userId) {
        BoardList list = boardListRepository.findById(listId)
                .orElseThrow(() -> new ResourceNotFoundException("List not found"));
        boardService.getEntityWithAccessCheck(list.getBoard().getId(), userId);
        return list;
    }

    @Transactional
    public void reorder(Long listId, Long userId, MoveListRequest request) {
        BoardList list = getEntityWithAccessCheck(listId, userId);
        List<BoardList> siblings = boardListRepository
                .findByBoardIdAndArchivedFalseOrderByPositionAsc(list.getBoard().getId());

        siblings.remove(list);
        int target = Math.max(0, Math.min(request.getNewPosition(), siblings.size()));
        siblings.add(target, list);

        for (int i = 0; i < siblings.size(); i++) {
            siblings.get(i).setPosition(i);
        }
        boardListRepository.saveAll(siblings);
    }

    public void archive(Long listId, Long userId) {
        BoardList list = getEntityWithAccessCheck(listId, userId);
        list.setArchived(true);
        boardListRepository.save(list);
    }
}
