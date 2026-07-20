package com.kanban.app.service;

import com.kanban.app.dto.request.NameRequest;
import com.kanban.app.dto.response.BoardResponse;
import com.kanban.app.entity.Board;
import com.kanban.app.entity.User;
import com.kanban.app.entity.Workspace;
import com.kanban.app.exception.ResourceNotFoundException;
import com.kanban.app.repository.BoardRepository;
import com.kanban.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final WorkspaceService workspaceService;

    public BoardResponse create(Long workspaceId, Long userId, NameRequest request) {
        Workspace ws = workspaceService.getEntityWithAccessCheck(workspaceId, userId);
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Board board = Board.builder()
                .name(request.getName())
                .backgroundColor(request.getBackgroundColor())
                .workspace(ws)
                .createdBy(creator)
                .archived(false)
                .build();
        board = boardRepository.save(board);
        return BoardResponse.from(board);
    }

    public List<BoardResponse> listByWorkspace(Long workspaceId, Long userId) {
        workspaceService.getEntityWithAccessCheck(workspaceId, userId);
        return boardRepository.findByWorkspaceIdAndArchivedFalse(workspaceId).stream()
                .map(BoardResponse::from)
                .toList();
    }

    public Board getEntityWithAccessCheck(Long boardId, Long userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        // Re-validates via the workspace/org membership chain
        workspaceService.getEntityWithAccessCheck(board.getWorkspace().getId(), userId);
        return board;
    }

    public BoardResponse get(Long boardId, Long userId) {
        return BoardResponse.from(getEntityWithAccessCheck(boardId, userId));
    }

    public void archive(Long boardId, Long userId) {
        Board board = getEntityWithAccessCheck(boardId, userId);
        board.setArchived(true);
        boardRepository.save(board);
    }
}
